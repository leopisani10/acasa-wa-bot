import React, { useState } from 'react';
import { Save, X, Eye, EyeOff, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { User } from '../../types';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { SYSTEM_MODULES, getRequiredModulesForUser, validateModuleSelection } from '../../types/modules';
import { ModulePermissionMatrix } from './ModulePermissionMatrix';

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  position: string;
  unit: string;
  type: 'matriz' | 'franqueado';
  role: 'admin' | 'staff';
  enabledModules: string[];
}

export const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSave }) => {
  const { addUser, updateUser } = useUserManagement();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    position: user?.position || '',
    unit: user?.unit || 'Botafogo',
    type: user?.type || 'matriz',
    role: user?.role || 'staff',
    enabledModules: user ? [] : getRequiredModulesForUser('staff'), // Will be loaded from permissions
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // When role changes, update default modules
      if (field === 'role') {
        newData.enabledModules = getRequiredModulesForUser(value as 'staff' | 'admin');
      }
      
      return newData;
    });
    setError(null);
  };

  const handleModulePermissionsChange = (moduleIds: string[]) => {
    setFormData(prev => ({ ...prev, enabledModules: moduleIds }));
    
    // Validate dependencies
    const validation = validateModuleSelection(moduleIds);
    setValidationWarnings(validation.warnings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!user && formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        setIsLoading(false);
        return;
      }

      // Validate module dependencies
      const validation = validateModuleSelection(formData.enabledModules);
      if (!validation.isValid) {
        setError(`Dependências de módulos não atendidas: ${validation.warnings.join(', ')}`);
        setIsLoading(false);
        return;
      }

      console.log('Validation passed, calling API...');
      let result;
      if (user) {
        // Update existing user
        console.log('Updating existing user...');
        result = await updateUser(user.id, {
          name: formData.name,
          email: formData.email,
          position: formData.position,
          unit: formData.unit,
          type: formData.type,
          role: formData.role,
        });
      } else {
        // Create new user
        console.log('Creating new user...');
        result = await addUser(formData);
      }

      console.log('API call result:', result);

      if (result.success) {
        console.log('User saved successfully');
        onSave();
        onClose();
      } else {
        console.error('User save failed:', result.message);
        setError(result.message || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setError(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
      console.log('Form submission completed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <p className="text-gray-600">
              {user ? 'Atualize as informações do usuário' : 'Adicione um novo usuário ao sistema'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                {error}
              </div>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle size={16} className="mr-2" />
                  <span className="font-medium">Avisos de Dependências:</span>
                </div>
                <ul className="text-sm space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                {!user && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione o cargo...</option>
                    <option value="Administrador Geral">Administrador Geral</option>
                    <option value="Médico">Médico</option>
                    <option value="Enfermeira">Enfermeira</option>
                    <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                    <option value="Fisioterapeuta">Fisioterapeuta</option>
                    <option value="Fonoaudióloga">Fonoaudióloga</option>
                    <option value="Psicóloga">Psicóloga</option>
                    <option value="Nutricionista">Nutricionista</option>
                    <option value="Assistente Social">Assistente Social</option>
                    <option value="Cuidador de Idosos">Cuidador de Idosos</option>
                    <option value="Auxiliar de Serviços Gerais">Auxiliar de Serviços Gerais</option>
                    <option value="Cozinheira">Cozinheira</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="Botafogo">Botafogo</option>
                    <option value="Tijuca">Tijuca</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Role and Type */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Acesso e Classificação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Papel no Sistema *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="staff"
                        checked={formData.role === 'staff'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Colaborador</div>
                        <div className="text-sm text-gray-600">Acesso limitado aos módulos necessários para sua função</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={formData.role === 'admin'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center">
                          Administrador
                          <Shield className="ml-2 text-purple-600" size={16} />
                        </div>
                        <div className="text-sm text-gray-600">Acesso completo a todos os módulos administrativos</div>
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="matriz">Matriz</option>
                    <option value="franqueado">Franqueado</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Module Permissions */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Permissões de Módulos
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="text-blue-600 mr-2" size={16} />
                  <span className="text-blue-700 text-sm font-medium">
                    Seleção inteligente: dependências são adicionadas automaticamente
                  </span>
                </div>
              </div>
              <ModulePermissionMatrix
                selectedModules={formData.enabledModules}
                userRole={formData.role}
                onChange={handleModulePermissionsChange}
              />
            </section>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || validationWarnings.length > 0}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {user ? 'Atualizar' : 'Criar'} Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};