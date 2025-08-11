import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { User } from '../types';
import { UserPermissions, SYSTEM_MODULES, validateModuleSelection, autoFixModuleSelection } from '../types/modules';

interface UserManagementContextType {
  users: User[];
  userPermissions: Record<string, UserPermissions>;
  loading: boolean;
  error: string | null;
  addUser: (userData: CreateUserData) => Promise<{ success: boolean; message?: string }>;
  updateUser: (id: string, userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  updateUserPermissions: (userId: string, moduleIds: string[]) => Promise<{ success: boolean; message?: string }>;
  getUserPermissions: (userId: string) => UserPermissions | null;
  getUserModules: (userId: string) => string[];
  validateUserModules: (userId: string, moduleIds: string[]) => { isValid: boolean; warnings: string[] };
  syncOrphanedUsers: () => Promise<{ success: boolean; message?: string }>;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  position: string;
  unit: string;
  type: 'matriz' | 'franqueado';
  role: 'admin' | 'staff';
  enabledModules: string[];
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};

interface UserManagementProviderProps {
  children: ReactNode;
}

export const UserManagementProvider: React.FC<UserManagementProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermissions>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    loadUserPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      console.log('🔍 SIMPLE: Fetching users from profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      console.log('🔍 SIMPLE: Profiles query result:', { data, error });
      
      if (error) {
        console.error('❌ SIMPLE: Database error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️ SIMPLE: No profiles found');
        setUsers([]);
        return;
      }
      
      const transformedUsers: User[] = data.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        position: profile.position,
        unit: profile.unit,
        type: profile.type,
      }));
      
      console.log('✅ SIMPLE: Transformed users:', transformedUsers.length);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('❌ SIMPLE: Error fetching users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = () => {
    try {
      const savedPermissions = localStorage.getItem('acasa_user_permissions');
      if (savedPermissions) {
        setUserPermissions(JSON.parse(savedPermissions));
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  };

  const saveUserPermissions = (permissions: Record<string, UserPermissions>) => {
    setUserPermissions(permissions);
    localStorage.setItem('acasa_user_permissions', JSON.stringify(permissions));
  };

  const addUser = async (userData: CreateUserData): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      console.log('🔍 SIMPLE: Starting user creation process...');
      console.log('🔍 SIMPLE: User data:', userData);
      
      // Validate module dependencies
      const validationResult = validateModuleSelection(userData.enabledModules);
      if (!validationResult.isValid) {
        console.log('❌ SIMPLE: Module validation failed:', validationResult.warnings);
        return {
          success: false,
          message: `Dependências não atendidas: ${validationResult.warnings.join(', ')}`
        };
      }

      console.log('✅ SIMPLE: Module validation passed');

      // Step 1: Create user in Supabase Auth
      console.log('🔍 SIMPLE: Creating auth user...');
      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            position: userData.position,
            unit: userData.unit,
            type: userData.type,
            role: userData.role,
          }
        }
      });

      if (authError) {
        console.error('❌ SIMPLE: Auth error:', authError);
        
        if (authError.message?.includes('User already registered')) {
          // User exists, try to find in profiles
          console.log('🔍 SIMPLE: User exists, checking profiles...');
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userData.email)
            .single();
          
          if (existingProfile) {
            console.log('✅ SIMPLE: Found existing profile, updating...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                name: userData.name,
                position: userData.position,
                unit: userData.unit,
                type: userData.type,
                role: userData.role,
              })
              .eq('id', existingProfile.id);
            
            if (updateError) throw updateError;
            
            // Save permissions
            const fixedModules = autoFixModuleSelection(userData.enabledModules);
            const newPermissions: UserPermissions = {
              userId: existingProfile.id,
              enabledModules: fixedModules,
            };
            const updatedPermissions = { ...userPermissions, [existingProfile.id]: newPermissions };
            saveUserPermissions(updatedPermissions);
            
            await fetchUsers();
            return { success: true, message: 'Usuário atualizado com sucesso!' };
          } else {
            return { success: false, message: 'Este email já está cadastrado mas não foi possível encontrar o perfil' };
          }
        } else {
          throw authError;
        }
      }

      if (!authResult.user) {
        console.error('❌ SIMPLE: No user returned from auth');
        return { success: false, message: 'Erro ao criar usuário na autenticação' };
      }

      console.log('✅ SIMPLE: Auth user created:', authResult.user.id);

      // Step 2: Create profile
      console.log('🔍 SIMPLE: Creating profile...');
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authResult.user.id,
          email: userData.email,
          name: userData.name,
          position: userData.position,
          unit: userData.unit,
          type: userData.type,
          role: userData.role,
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ SIMPLE: Profile error:', profileError);
        throw profileError;
      }

      console.log('✅ SIMPLE: Profile created:', profileResult);

      // Step 3: Save permissions
      console.log('🔍 SIMPLE: Saving permissions...');
      const fixedModules = autoFixModuleSelection(userData.enabledModules);
      const newPermissions: UserPermissions = {
        userId: authResult.user.id,
        enabledModules: fixedModules,
      };
      const updatedPermissions = { ...userPermissions, [authResult.user.id]: newPermissions };
      saveUserPermissions(updatedPermissions);
      
      console.log('✅ SIMPLE: Permissions saved');

      // Step 4: Refresh user list
      console.log('🔍 SIMPLE: Refreshing user list...');
      await fetchUsers();
      
      console.log('✅ SIMPLE: User creation completed successfully');
      return { success: true, message: 'Usuário criado com sucesso!' };
      
    } catch (error) {
      console.error('❌ SIMPLE: Error in addUser process:', error);
      
      let message = 'Erro ao criar usuário';
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message?.includes('weak password')) {
          message = 'Senha muito fraca. Use pelo menos 6 caracteres';
        } else if (error.message?.includes('Invalid email')) {
          message = 'Email inválido. Verifique o formato do email';
        } else if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          message = 'Este email já está sendo usado por outro usuário';
        } else {
          message = `Erro: ${error.message}`;
        }
      }
      
      return { success: false, message };
    }
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      console.log('🔍 SIMPLE: Updating user:', id, 'with data:', userData);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          email: userData.email,
          name: userData.name,
          position: userData.position,
          unit: userData.unit,
          type: userData.type,
          role: userData.role,
        })
        .eq('id', id);
      
      if (error) {
        console.error('❌ SIMPLE: Update error:', error);
        throw error;
      }
      
      console.log('✅ SIMPLE: User updated successfully');
      await fetchUsers();
      return { success: true, message: 'Usuário atualizado com sucesso!' };
    } catch (error) {
      console.error('❌ SIMPLE: Error updating user:', error);
      
      let message = 'Erro ao atualizar usuário';
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
          message = 'Este email já está sendo usado por outro usuário';
        } else {
          message = `Erro: ${error.message}`;
        }
      }
      
      return { success: false, message };
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      console.log('🔍 SIMPLE: Deleting user:', id);
      
      // Delete from profiles (auth user will be handled by trigger)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ SIMPLE: Delete error:', error);
        throw error;
      }
      
      // Remove permissions
      const updatedPermissions = { ...userPermissions };
      delete updatedPermissions[id];
      saveUserPermissions(updatedPermissions);
      
      console.log('✅ SIMPLE: User deleted successfully');
      await fetchUsers();
      return { success: true, message: 'Usuário excluído com sucesso!' };
    } catch (error) {
      console.error('❌ SIMPLE: Error deleting user:', error);
      let message = 'Erro ao excluir usuário';
      
      if (error && typeof error === 'object' && 'message' in error) {
        message = `Erro: ${error.message}`;
      }
      
      return { success: false, message };
    }
  };

  const syncOrphanedUsers = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      console.log('🔍 SIMPLE: Syncing orphaned users...');
      
      // This is a simplified version - just refresh the user list
      await fetchUsers();
      return { success: true, message: 'Lista de usuários atualizada' };
    } catch (error) {
      console.error('❌ SIMPLE: Error syncing users:', error);
      return { success: false, message: 'Erro ao atualizar lista de usuários' };
    }
  };

  const updateUserPermissions = async (userId: string, moduleIds: string[]): Promise<{ success: boolean; message?: string }> => {
    try {
      // Auto-fix dependencies
      const fixedModules = autoFixModuleSelection(moduleIds);
      
      const newPermissions: UserPermissions = {
        userId,
        enabledModules: fixedModules,
      };

      const updatedPermissions = {
        ...userPermissions,
        [userId]: newPermissions,
      };
      
      saveUserPermissions(updatedPermissions);
      return { success: true };
    } catch (error) {
      console.error('Error updating user permissions:', error);
      return { success: false, message: 'Erro ao atualizar permissões' };
    }
  };

  const getUserPermissions = (userId: string): UserPermissions | null => {
    return userPermissions[userId] || null;
  };

  const getUserModules = (userId: string): string[] => {
    const permissions = getUserPermissions(userId);
    if (!permissions) {
      // Return default modules for user role
      const user = users.find(u => u.id === userId);
      if (user) {
        return Object.values(SYSTEM_MODULES)
          .filter(module => module.isRequired || (module.minRole === 'staff' && user.role === 'admin'))
          .map(module => module.id);
      }
      return ['dashboard', 'profile'];
    }
    return permissions.enabledModules;
  };

  const validateUserModules = (userId: string, moduleIds: string[]) => {
    const validation = validateModuleSelection(moduleIds);
    return {
      isValid: validation.isValid,
      warnings: validation.warnings,
    };
  };

  const value = {
    users,
    userPermissions,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    getUserPermissions,
    getUserModules,
    validateUserModules,
    syncOrphanedUsers,
  };

  return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
};