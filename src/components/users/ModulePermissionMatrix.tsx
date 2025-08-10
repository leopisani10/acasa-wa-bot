import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Home, Users, User, FileText, Calendar, Clock, ChefHat, Clipboard, Receipt, Settings, UserCog, Shield } from 'lucide-react';
import { SYSTEM_MODULES, SystemModule, validateModuleSelection, autoFixModuleSelection } from '../../types/modules';

interface ModulePermissionMatrixProps {
  selectedModules: string[];
  userRole: 'admin' | 'staff';
  onChange: (moduleIds: string[]) => void;
}

export const ModulePermissionMatrix: React.FC<ModulePermissionMatrixProps> = ({
  selectedModules,
  userRole,
  onChange
}) => {
  const [showDependencies, setShowDependencies] = useState(false);
  const [validationResult, setValidationResult] = useState(validateModuleSelection(selectedModules));

  useEffect(() => {
    setValidationResult(validateModuleSelection(selectedModules));
  }, [selectedModules]);

  const getModuleIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Home,
      Users,
      User,
      FileText,
      Calendar,
      Clock,
      ChefHat,
      Clipboard,
      Receipt,
      Settings,
      UserCog,
      Shield,
      AlertTriangle,
    };
    return icons[iconName] || FileText;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-blue-50 border-blue-200';
      case 'clinical': return 'bg-green-50 border-green-200';
      case 'administrative': return 'bg-purple-50 border-purple-200';
      case 'support': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'core': return 'text-blue-700';
      case 'clinical': return 'text-green-700';
      case 'administrative': return 'text-purple-700';
      case 'support': return 'text-orange-700';
      default: return 'text-gray-700';
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    const module = SYSTEM_MODULES[moduleId];
    if (module.isRequired) return; // Cannot toggle required modules

    let newSelectedModules;
    if (selectedModules.includes(moduleId)) {
      // Removing module - check what depends on it
      const dependentModules = selectedModules.filter(id => 
        SYSTEM_MODULES[id]?.dependencies.includes(moduleId)
      );
      
      if (dependentModules.length > 0) {
        const dependentNames = dependentModules.map(id => SYSTEM_MODULES[id]?.name).join(', ');
        if (!window.confirm(`Remover "${module.name}" irá afetar: ${dependentNames}. Continuar?`)) {
          return;
        }
        // Remove this module and all dependent modules
        newSelectedModules = selectedModules.filter(id => 
          id !== moduleId && !dependentModules.includes(id)
        );
      } else {
        newSelectedModules = selectedModules.filter(id => id !== moduleId);
      }
    } else {
      // Adding module - add with dependencies
      newSelectedModules = autoFixModuleSelection([...selectedModules, moduleId]);
    }

    onChange(newSelectedModules);
  };

  const handleSelectAll = () => {
    const availableModules = Object.values(SYSTEM_MODULES)
      .filter(module => module.minRole === 'staff' || (module.minRole === 'admin' && userRole === 'admin'))
      .map(module => module.id);
    
    onChange(autoFixModuleSelection(availableModules));
  };

  const handleSelectRequired = () => {
    const requiredModules = Object.values(SYSTEM_MODULES)
      .filter(module => module.isRequired)
      .map(module => module.id);
    
    onChange(autoFixModuleSelection(requiredModules));
  };

  const categories = [
    { id: 'core', name: 'Módulos Essenciais', description: 'Funcionalidades básicas do sistema' },
    { id: 'clinical', name: 'Módulos Clínicos', description: 'Ferramentas para cuidados médicos' },
    { id: 'administrative', name: 'Módulos Administrativos', description: 'Gestão e administração' },
    { id: 'support', name: 'Módulos de Apoio', description: 'Ferramentas auxiliares' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleSelectRequired}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Apenas Essenciais
          </button>
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Selecionar Todos
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDependencies(!showDependencies)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showDependencies ? 'Ocultar' : 'Mostrar'} Dependências
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {selectedModules.length} de {Object.keys(SYSTEM_MODULES).length} módulos selecionados
        </div>
      </div>

      {/* Module Categories */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryModules = Object.values(SYSTEM_MODULES)
            .filter(module => module.category === category.id)
            .filter(module => module.minRole === 'staff' || (module.minRole === 'admin' && userRole === 'admin'));

          if (categoryModules.length === 0) return null;

          return (
            <div key={category.id} className={`border rounded-lg overflow-hidden ${getCategoryColor(category.id)}`}>
              <div className="p-4 border-b border-gray-200 bg-white">
                <h4 className={`font-semibold ${getCategoryTextColor(category.id)} text-lg`}>
                  {category.name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              </div>
              
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryModules.map(module => {
                    const Icon = getModuleIcon(module.icon);
                    const isSelected = selectedModules.includes(module.id);
                    const isRequired = module.isRequired;
                    const hasAccess = module.minRole === 'staff' || userRole === 'admin';
                    const hasDependencyIssue = !isSelected && module.requiredBy.some(reqId => selectedModules.includes(reqId));
                    const dependsOnMissing = isSelected && module.dependencies.some(depId => !selectedModules.includes(depId));

                    return (
                      <div
                        key={module.id}
                        className={`relative p-4 border rounded-lg transition-all cursor-pointer ${
                          !hasAccess 
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                            : isSelected
                              ? 'bg-green-50 border-green-300 shadow-sm'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                        } ${
                          hasDependencyIssue ? 'ring-2 ring-yellow-400' : ''
                        } ${
                          dependsOnMissing ? 'ring-2 ring-red-400' : ''
                        }`}
                        onClick={() => hasAccess && handleModuleToggle(module.id)}
                      >
                        {/* Status Indicators */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Icon className={`mr-2 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} size={18} />
                            {isSelected ? (
                              <CheckCircle className="text-green-600" size={16} />
                            ) : (
                              <XCircle className="text-gray-400" size={16} />
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {isRequired && (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                Obrigatório
                              </div>
                            )}
                            {!hasAccess && (
                              <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                                Admin
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Module Info */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">{module.name}</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">{module.description}</p>
                        </div>

                        {/* Dependency Info */}
                        {showDependencies && (module.dependencies.length > 0 || module.requiredBy.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {module.dependencies.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs font-medium text-gray-700 mb-1">Depende de:</div>
                                <div className="flex flex-wrap gap-1">
                                  {module.dependencies.map(depId => (
                                    <span key={depId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {SYSTEM_MODULES[depId]?.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {module.requiredBy.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">Requerido por:</div>
                                <div className="flex flex-wrap gap-1">
                                  {module.requiredBy.map(reqId => (
                                    <span key={reqId} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                      {SYSTEM_MODULES[reqId]?.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Warning Indicators */}
                        {hasDependencyIssue && (
                          <div className="absolute -top-1 -right-1">
                            <AlertTriangle className="text-yellow-500 bg-white rounded-full p-1" size={20} />
                          </div>
                        )}
                        {dependsOnMissing && (
                          <div className="absolute -top-1 -right-1">
                            <AlertTriangle className="text-red-500 bg-white rounded-full p-1" size={20} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Summary */}
      {!validationResult.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <span className="font-medium text-red-800">Problemas de Dependências Detectados</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationResult.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onChange(autoFixModuleSelection(selectedModules))}
            className="mt-3 flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <CheckCircle size={16} className="mr-2" />
            Corrigir Automaticamente
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Módulos Selecionados:</span>
            <span className="ml-2 text-gray-900">{selectedModules.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Módulos Obrigatórios:</span>
            <span className="ml-2 text-gray-900">
              {Object.values(SYSTEM_MODULES).filter(m => m.isRequired).length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`ml-2 font-medium ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {validationResult.isValid ? 'Válido' : 'Pendências'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};