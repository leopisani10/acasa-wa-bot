import React, { useState, useEffect } from 'react';
import { X, Key, Save, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { User } from '../../types';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { ModulePermissionMatrix } from './ModulePermissionMatrix';
import { validateModuleSelection } from '../../types/modules';

interface UserPermissionsModalProps {
  user: User;
  onClose: () => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({ user, onClose }) => {
  const { updateUserPermissions, getUserModules } = useUserManagement();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load current user modules
    const currentModules = getUserModules(user.id);
    setSelectedModules(currentModules);
  }, [user.id, getUserModules]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate dependencies
      const validation = validateModuleSelection(selectedModules);
      if (!validation.isValid) {
        setError(`Dependências não atendidas: ${validation.warnings.join(', ')}`);
        setIsLoading(false);
        return;
      }

      const result = await updateUserPermissions(user.id, selectedModules);
      
      if (result.success) {
        setSuccess('Permissões atualizadas com sucesso!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Erro ao atualizar permissões');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setError('Erro inesperado ao salvar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Key className="mr-3 text-orange-600" size={24} />
              Permissões de Módulos
            </h2>
            <p className="text-gray-600 mt-1">
              <strong>{user.name}</strong> • {user.position} • {user.unit}
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-6">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {success}
            </div>
          )}

          {/* Role Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Shield className="text-blue-600 mr-2" size={20} />
              <div>
                <h4 className="font-semibold text-blue-900">Informações do Papel</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {user.role === 'admin' 
                    ? 'Como administrador, este usuário pode ter acesso a todos os módulos do sistema.'
                    : 'Como colaborador, este usuário tem acesso limitado baseado em suas necessidades funcionais.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Module Matrix */}
          <ModulePermissionMatrix
            selectedModules={selectedModules}
            userRole={user.role}
            onChange={setSelectedModules}
          />
        </div>

        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Salvar Permissões
          </button>
        </div>
      </div>
    </div>
  );
};