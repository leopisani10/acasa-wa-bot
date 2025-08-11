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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list-orphaned`, {
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
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-orphaned'
        }),
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
      console.log('🔍 DEBUG: Starting addUser process...');
      console.log('🔍 DEBUG: User data received:', userData);
      
      // Validate module dependencies
      const validationResult = validateModuleSelection(userData.enabledModules);
      if (!validationResult.isValid) {
        console.log('❌ DEBUG: Module validation failed:', validationResult.warnings);
        return {
          success: false,
          message: `Dependências não atendidas: ${validationResult.warnings.join(', ')}`
        };
      }

      console.log('✅ DEBUG: Module validation passed');
      console.log('🔍 DEBUG: Getting current session...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ DEBUG: No session found');
        return { success: false, message: 'Usuário não autenticado' };
      }

      console.log('✅ DEBUG: Session found, calling edge function...');

      // Call edge function to handle user creation/update
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-or-update',
          userData: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            position: userData.position,
            unit: userData.unit,
            type: userData.type,
            role: userData.role,
          }
        }),
      });

      console.log('🔍 DEBUG: Edge function response status:', response.status);
      
      const result = await response.json();
      console.log('🔍 DEBUG: Edge function result:', result);
      
      if (!response.ok) {
        console.error('❌ DEBUG: Edge function failed:', result);
        throw new Error(result.error || 'Erro ao processar usuário');
      }
      
      const { user, isUpdate } = result;
      console.log('✅ DEBUG: Edge function succeeded:', { user, isUpdate });
      
      // Save user permissions
      const fixedModules = autoFixModuleSelection(userData.enabledModules);
      const newPermissions: UserPermissions = {
        userId: user.id,
        enabledModules: fixedModules,
      };

      const updatedPermissions = {
        ...userPermissions,
        [user.id]: newPermissions,
      };
      saveUserPermissions(updatedPermissions);
      
      console.log('✅ DEBUG: Permissions saved');
      console.log('🔍 DEBUG: Refreshing user list...');

      await fetchUsers();
      
      console.log('✅ DEBUG: User creation process completed successfully');
      return { 
        success: true, 
        message: isUpdate ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!' 
      };
      
    } catch (error) {
      console.error('❌ DEBUG: Error in addUser process:', error);
      console.error('❌ DEBUG: Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });

      let message = 'Erro ao criar usuário';
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message?.includes('weak password')) {
          message = 'Senha muito fraca. Use pelo menos 6 caracteres';
        } else if (error.message?.includes('Invalid email')) {
          message = 'Email inválido. Verifique o formato do email';
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
      
      console.log('🔍 DEBUG: Updating user:', id, 'with data:', userData);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      // Call edge function to handle user update
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          position: userData.position,
          unit: userData.unit,
          type: userData.type,
          role: userData.role,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ DEBUG: Edge function update failed:', result);
        throw new Error(result.error || 'Erro ao atualizar usuário');
      }
      
      console.log('✅ DEBUG: User updated successfully');
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
      
      console.log('🔍 DEBUG: Deleting user:', id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      // Call edge function to handle user deletion
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ DEBUG: Edge function delete failed:', result);
        throw new Error(result.error || 'Erro ao excluir usuário');
      }
      
      // Remove permissions
      const updatedPermissions = { ...userPermissions };
      delete updatedPermissions[id];
      saveUserPermissions(updatedPermissions);
      
      console.log('✅ DEBUG: User deleted successfully');
      await fetchUsers();
      return { success: true, message: 'Usuário excluído com sucesso!' };
    } catch (error) {
      console.error('Error deleting user:', error);
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