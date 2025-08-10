import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name: string, position: string, unit: string, type: 'matriz' | 'franqueado') => Promise<boolean>;
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      console.log('Checking user authentication...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Auth user:', authUser);
      
      if (authUser) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        console.log('Profile data:', profile);
        
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            position: profile.position,
            unit: profile.unit,
            type: profile.type,
          });
        } else {
          console.log('No profile found for user, signing out...');
          await supabase.auth.signOut();
        }
      } else {
        console.log('No authenticated user found');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // Se houver erro de conexão, tentar deslogar para limpar estado
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }
      
      console.log('Login data:', data);
      
      if (data.user) {
        await checkUser();
        
        // Verificar se o usuário foi definido corretamente
        const { data: { user: verifyUser } } = await supabase.auth.getUser();
        if (verifyUser) {
          setIsLoading(false);
          return { success: true };
        } else {
          throw new Error('Failed to verify user after login');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let message = 'Email ou senha incorretos. Verifique suas credenciais ou cadastre-se caso não tenha uma conta.';
      
      // Extract specific error message from Supabase
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes('Invalid login credentials')) {
          message = 'Credenciais inválidas. Verifique seu email e senha ou cadastre-se caso não tenha uma conta.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Invalid API key')) {
          message = 'Erro de configuração. Entre em contato com o administrador.';
        } else if (error.message.includes('Too many requests')) {
          message = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
        } else {
          message = `Erro: ${error.message}`;
        }
      }
      
      setIsLoading(false);
      return { success: false, message };
    }
    
    setIsLoading(false);
    return { success: false, message: 'Erro inesperado ao fazer login.' };
  };

  const register = async (email: string, password: string, name: string, position: string, unit: string, type: 'matriz' | 'franqueado'): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email,
            name,
            position,
            unit,
            type,
            role: 'staff',
          }]);
        
        if (profileError) throw profileError;
        
        await checkUser();
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Register error:', error);
      // Don't throw the error, just return false to show user-friendly message
    }
    
    setIsLoading(false);
    return false;
  };

  const updateProfile = async (profileData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    try {
      console.log('Updating profile for user:', user.id, 'with data:', profileData);
      
      const updateData: any = {};
      if (profileData.name !== undefined) updateData.name = profileData.name;
      if (profileData.email !== undefined) updateData.email = profileData.email;
      if (profileData.position !== undefined) updateData.position = profileData.position;
      if (profileData.unit !== undefined) updateData.unit = profileData.unit;
      if (profileData.type !== undefined) updateData.type = profileData.type;
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...profileData } : null);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let message = 'Erro ao atualizar perfil. Tente novamente.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes('row-level security policy')) {
          message = 'Erro de permissão: você não tem autorização para atualizar este perfil.';
        } else if (error.message.includes('unique constraint')) {
          message = 'Erro: Email já está sendo usado por outro usuário.';
        } else {
          message = `Erro: ${error.message}`;
        }
      }
      
      return { success: false, message };
    }
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    updateProfile,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};