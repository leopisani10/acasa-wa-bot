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
      console.log('Fetching users from profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      console.log('Profiles query result:', { data, error });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No profiles found, checking for orphaned auth users...');
        await checkForOrphanedUsers();
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
      
      console.log('Transformed users:', transformedUsers);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const checkForOrphanedUsers = async () => {
    try {
      console.log('Checking for orphaned auth users...');
      
      // Get current session for admin access
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found for orphaned user check');
        return;
      }

      // Call edge function to get auth users
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list-auth-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Auth users found:', result);
        
        if (result.authUsers && result.authUsers.length > 0) {
          setError(`Encontrados ${result.authUsers.length} usuários órfãos na autenticação. Use a função "Sincronizar Usuários" para corrigi-los.`);
        }
      }
    } catch (error) {
      console.error('Error checking orphaned users:', error);
    }
  };

  const syncOrphanedUsers = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      console.log('Syncing orphaned users...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=sync-orphaned`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao sincronizar usuários');
      }
      
      console.log('Sync result:', result);
      await fetchUsers();
      return { success: true, message: `${result.syncedCount || 0} usuários sincronizados com sucesso` };
    } catch (error) {
      console.error('Error syncing orphaned users:', error);
      return { success: false, message: 'Erro ao sincronizar usuários órfãos' };
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
      
      // Validate module dependencies
      const validationResult = validateModuleSelection(userData.enabledModules);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: `Dependências não atendidas: ${validationResult.warnings.join(', ')}`
        };
      }

      console.log('Creating user with data:', userData);

      // Create user in Supabase Auth directly
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      console.log('Supabase auth response:', { data, error });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('User created in auth, creating profile...');
        
        // Check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
        
        console.log('Profile check result:', { existingProfile, checkError });
        
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error('Error checking existing profile:', checkError);
          throw checkError;
        }
        
        if (!existingProfile) {
          // Profile doesn't exist, create it
          console.log('Creating new profile for user:', data.user.id);
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              position: userData.position,
              unit: userData.unit,
              type: userData.type,
              role: userData.role,
            }]);
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw profileError;
          }
          
          console.log('Profile created successfully');
        } else {
          // Profile already exists, update it instead
          console.log('Profile already exists, updating existing profile...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: userData.email,
              name: userData.name,
              position: userData.position,
              unit: userData.unit,
              type: userData.type,
              role: userData.role,
            })
            .eq('id', data.user.id);
          
          if (updateError) {
            console.error('Profile update error:', updateError);
            throw updateError;
          }
          
          console.log('Profile updated successfully');
        }
        
        // Save user permissions (same for both new and existing profiles)
        const fixedModules = autoFixModuleSelection(userData.enabledModules);
        const newPermissions: UserPermissions = {
          userId: data.user.id,
          enabledModules: fixedModules,
        };

        const updatedPermissions = {
          ...userPermissions,
          [data.user.id]: newPermissions,
        };
        saveUserPermissions(updatedPermissions);

        console.log('User creation/update completed successfully');
        await fetchUsers();
        return { success: true, message: 'Usuário criado com sucesso!' };
      }

      return { success: false, message: 'Falha ao criar usuário - dados não retornados' };
    } catch (error) {
      console.error('Error creating user:', error);
      let message = 'Erro ao criar usuário';
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes('duplicate key') || error.message.includes('already registered')) {
          message = 'Este email já está cadastrado';
        } else if (error.message.includes('weak password')) {
          message = 'Senha muito fraca. Use pelo menos 6 caracteres';
        } else if (error.message.includes('Insufficient permissions')) {
          message = 'Você não tem permissão para criar usuários';
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
      
      console.log('Updating user:', id, 'with data:', userData);
      
      // Update profile in database
      const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            position: userData.position,
            unit: userData.unit,
            type: userData.type,
        })
        .eq('id', id);
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      
      console.log('User updated successfully');
      await fetchUsers();
      return { success: true, message: 'Usuário atualizado com sucesso!' };
    } catch (error) {
      console.error('Error updating user:', error);
      
      let message = 'Erro ao atualizar usuário';
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
          message = 'Este email já está sendo usado por outro usuário';
        } else if (error.message.includes('Insufficient permissions')) {
          message = 'Você não tem permissão para atualizar usuários';
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
      
      console.log('Deleting user:', id);
      
      // Delete from auth (cascade will delete profile)
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) {
        console.error('Delete user error:', error);
        throw error;
      }
      
      // Remove permissions
      const updatedPermissions = { ...userPermissions };
      delete updatedPermissions[id];
      saveUserPermissions(updatedPermissions);
      
      console.log('User deleted successfully');
      await fetchUsers();
      return { success: true, message: 'Usuário excluído com sucesso!' };
    } catch (error) {
      console.error('
      )
    }
  }
}Error deleting user:', error);
      let message = 'Erro ao excluir usuário';
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes('Insufficient permissions')) {
          message = 'Você não tem permissão para excluir usuários';
        } else {
          message = `Erro: ${error.message}`;
        }
      }
      
      return { success: false, message };
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