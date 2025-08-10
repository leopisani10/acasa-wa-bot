import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const action = url.searchParams.get('action')

    // Handle POST requests for creating users
    if (method === 'POST' && !action) {
      try {
        const userData = await req.json()
        
        // Create user in Supabase Auth
        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          user_metadata: {
            name: userData.name,
            position: userData.position,
            unit: userData.unit,
            type: userData.type,
            role: userData.role,
          },
          email_confirm: true,
        })

        if (authError) {
          console.error('Auth error:', authError)
          return new Response(
            JSON.stringify({ error: authError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        if (!newUser.user) {
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Create profile
        const profileData = {
          id: newUser.user.id,
          email: userData.email,
          name: userData.name,
          position: userData.position,
          unit: userData.unit,
          type: userData.type,
          role: userData.role,
          created_by: user.id,
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          
          // Clean up auth user if profile creation failed
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
          
          return new Response(
            JSON.stringify({ error: 'Failed to create user profile' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: {
              id: newUser.user.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              position: userData.position,
              unit: userData.unit,
              type: userData.type,
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('Error creating user:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle GET requests for listing orphaned users
    if (method === 'GET' && action === 'list-orphaned') {
      try {
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError) {
          return new Response(
            JSON.stringify({ error: authError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id')

        if (profilesError) {
          return new Response(
            JSON.stringify({ error: profilesError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const existingProfileIds = new Set(profiles.map(p => p.id))
        const orphanedUsers = authUsers.users.filter(authUser => 
          !existingProfileIds.has(authUser.id)
        )

        return new Response(
          JSON.stringify({ 
            authUsers: orphanedUsers,
            totalOrphaned: orphanedUsers.length 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('Error listing auth users:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to list auth users' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle POST requests for syncing orphaned users
    if (method === 'POST' && action === 'sync-orphaned') {
      try {
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError) {
          return new Response(
            JSON.stringify({ error: authError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id')

        if (profilesError) {
          return new Response(
            JSON.stringify({ error: profilesError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const existingProfileIds = new Set(profiles.map(p => p.id))
        const orphanedUsers = authUsers.users.filter(authUser => 
          !existingProfileIds.has(authUser.id)
        )

        let syncedCount = 0
        const errors: string[] = []

        for (const authUser of orphanedUsers) {
          try {
            const userMetadata = authUser.user_metadata || {}
            
            const profileData = {
              id: authUser.id,
              email: authUser.email || 'email@unknown.com',
              name: userMetadata.name || authUser.email?.split('@')[0] || 'Usuário',
              position: userMetadata.position || 'A definir',
              unit: userMetadata.unit || 'Botafogo',
              type: userMetadata.type || 'matriz',
              role: userMetadata.role || 'staff',
              created_by: user.id,
            }

            const { error: insertError } = await supabaseAdmin
              .from('profiles')
              .insert(profileData)

            if (insertError) {
              console.error('Error creating profile for user:', authUser.id, insertError)
              errors.push(`${authUser.email}: ${insertError.message}`)
            } else {
              syncedCount++
              console.log('Successfully synced user:', authUser.email)
            }
          } catch (error) {
            console.error('Error processing user:', authUser.id, error)
            errors.push(`${authUser.email}: Erro inesperado`)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            syncedCount,
            totalOrphaned: orphanedUsers.length,
            errors: errors.length > 0 ? errors : undefined
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('Error syncing orphaned users:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to sync orphaned users' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle PUT requests for updating users
    if (method === 'PUT') {
      try {
        const userId = url.pathname.split('/').pop()
        const userData = await req.json()

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Update profile in database
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            name: userData.name,
            position: userData.position,
            unit: userData.unit,
            type: userData.type,
            role: userData.role,
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Profile update error:', profileError)
          return new Response(
            JSON.stringify({ error: 'Failed to update user profile' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Update user metadata in auth
        if (userData.email) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: userData.email,
            user_metadata: {
              name: userData.name,
              position: userData.position,
              unit: userData.unit,
              type: userData.type,
              role: userData.role,
            }
          })

          if (authError) {
            console.error('Auth update error:', authError)
            // Continue even if auth update fails
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('Error updating user:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle DELETE requests for deleting users
    if (method === 'DELETE') {
      try {
        const userId = url.pathname.split('/').pop()

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Delete user from auth (this will cascade to profile due to FK constraint)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
          console.error('Auth delete error:', authError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete user' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('Error deleting user:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})