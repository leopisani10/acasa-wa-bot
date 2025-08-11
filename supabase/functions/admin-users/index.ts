import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Handle different routes and methods
    if (req.method === 'GET') {
      const action = url.searchParams.get('action');
      
      if (action === 'list-orphaned') {
        // List orphaned auth users (users in auth but not in profiles)
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id');

        const profileIds = new Set(profiles?.map(p => p.id) || []);
        const orphanedUsers = authUsers.users.filter(user => !profileIds.has(user.id));
        
        return new Response(
          JSON.stringify({ authUsers: orphanedUsers }),
          { headers: corsHeaders }
        );
      }
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const action = body.action;
      
      if (action === 'create-or-update') {
        const { userData } = body;
        console.log('🔍 EDGE: Creating/updating user with data:', userData);
        
        // Try to get existing user by email first
        let authUser;
        let isUpdate = false;
        
        console.log('🔍 EDGE: Checking if user exists by email:', userData.email);
        
        // Get all users and filter by email (correct way to find user by email)
        const { data: { users: allUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listUsersError) {
          console.error('❌ EDGE: Error listing users:', listUsersError);
          throw listUsersError;
        }
        
        console.log('🔍 EDGE: Found', allUsers?.length || 0, 'total users');
        const existingUser = allUsers?.find(u => u.email === userData.email);
        console.log('🔍 EDGE: Existing user found:', !!existingUser, existingUser?.id);

        if (existingUser) {
            console.log('✅ EDGE: Found existing auth user:', existingUser.id);
            authUser = existingUser; // Use the found user
            isUpdate = true;
            
            // Update user metadata (if needed, this is handled by updateUserById below)
        } else {
            console.log('🔍 EDGE: User not found, creating new one...');
            // Create new user
            const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
              email: userData.email,
              password: userData.password,
              email_confirm: true, // Auto-confirm email
              user_metadata: {
                name: userData.name,
                position: userData.position,
                unit: userData.unit,
                type: userData.type,
                role: userData.role,
              }
            });
            
            if (signUpError) {
              console.error('❌ EDGE: Error creating auth user:', signUpError);
              throw signUpError;
            }
            
            console.log('✅ EDGE: Created new auth user:', newUser.user.id);
            authUser = newUser.user;
            isUpdate = false;
        }

        // If it's an update, update the user's metadata in auth.users
        if (isUpdate && authUser) {
          const { error: updateAuthUserError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { user_metadata: { name: userData.name, position: userData.position, unit: userData.unit, type: userData.type, role: userData.role } }
          );
          if (updateAuthUserError) {
            console.error('❌ EDGE: Error updating auth user metadata:', updateAuthUserError);
            throw updateAuthUserError;
          }
        }
        
        // Now handle the profile
        const profileData = {
          id: authUser.id,
          email: userData.email,
          name: userData.name,
          position: userData.position,
          unit: userData.unit,
          type: userData.type,
          role: userData.role,
        };
        
        console.log('🔍 EDGE: Handling profile for user:', authUser.id);
        
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .single();
        
        let profileResult;
        
        if (checkError && checkError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('🔍 EDGE: Creating new profile...');
          profileResult = await supabaseAdmin
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
        } else if (existingProfile) {
          // Profile exists, update it
          console.log('🔍 EDGE: Updating existing profile...');
          profileResult = await supabaseAdmin
            .from('profiles')
            .update({
              email: userData.email,
              name: userData.name,
              position: userData.position,
              unit: userData.unit,
              type: userData.type,
              role: userData.role,
            })
            .eq('id', authUser.id)
            .select()
            .single();
        } else {
          console.error('❌ EDGE: Unexpected profile check result:', checkError);
          throw checkError;
        }
        
        if (profileResult.error) {
          console.error('❌ EDGE: Profile operation failed:', profileResult.error);
          throw profileResult.error;
        }
        
        console.log('✅ EDGE: Profile operation successful');
        
        return new Response(
          JSON.stringify({ 
            user: profileResult.data,
            isUpdate 
          }),
          { headers: corsHeaders }
        );
      }
      
      if (action === 'sync-orphaned') {
        // Sync orphaned users
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id');

        const profileIds = new Set(profiles?.map(p => p.id) || []);
        const orphanedUsers = authUsers.users.filter(user => !profileIds.has(user.id));
        
        let syncedCount = 0;
        for (const authUser of orphanedUsers) {
          try {
            await supabaseAdmin
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.name || authUser.email || 'Usuário',
                position: authUser.user_metadata?.position || 'Não definido',
                unit: authUser.user_metadata?.unit || 'Não definido',
                type: authUser.user_metadata?.type || 'matriz',
                role: authUser.user_metadata?.role || 'staff',
              });
            syncedCount++;
          } catch (error) {
            console.error('Error syncing user:', authUser.id, error);
          }
        }

        return new Response(
          JSON.stringify({ syncedCount }),
          { headers: corsHeaders }
        );
      }
    }

    if (req.method === 'PUT') {
      // Update user by ID
      const userId = pathParts[pathParts.length - 1]; // Get ID from URL path
      const userData = await req.json();
      
      console.log('🔍 EDGE: Updating user:', userId, 'with data:', userData);
      
      // Update profile in database
      const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          email: userData.email,
          name: userData.name,
          position: userData.position,
          unit: userData.unit,
          type: userData.type,
          role: userData.role,
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ EDGE: Profile update error:', profileError);
        throw profileError;
      }
      
      console.log('✅ EDGE: User updated successfully');
      
      return new Response(
        JSON.stringify({ user: updatedProfile }),
        { headers: corsHeaders }
      );
    }

    if (req.method === 'DELETE') {
      // Delete user by ID
      const userId = pathParts[pathParts.length - 1]; // Get ID from URL path
      
      console.log('🔍 EDGE: Deleting user:', userId);
      
      // Delete from auth (cascade will delete profile)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('❌ EDGE: Delete user error:', error);
        throw error;
      }
      
      console.log('✅ EDGE: User deleted successfully');
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or method' }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ EDGE: Error in admin-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});