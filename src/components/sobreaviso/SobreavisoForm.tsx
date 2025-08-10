import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { SobreavisoEmployee } from '../../types';
import { useSobreaviso } from '../../contexts/SobreavisoContext';

interface SobreavisoFormProps {
  employee?: SobreavisoEmployee;
  onClose: () => void;
  onSave: () => void;
}

export const SobreavisoForm: React.FC<SobreavisoFormProps> = ({ employee, onClose, onSave }) => {
  const { addSobreavisoEmployee, updateSobreavisoEmployee } = useSobreaviso();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<SobreavisoEmployee, 'id' | 'createdAt' | 'updatedAt'>>({
    fullName: employee?.fullName || '',
    cpf: employee?.cpf || '',
    position: employee?.position || '',
    phone: employee?.phone || '',
    unit: employee?.unit || 'Botafogo',
    status: employee?.status || 'Ativo',
    observations: employee?.observations || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (employee) {
        updateSobreavisoEmployee(employee.id, formData);
      } else {
        addSobreavisoEmployee(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar colaborador de sobreaviso:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {employee ? 'Editar Colaborador' : 'Novo Colaborador de Sobreaviso'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="(21) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={formData.pix || ''}
                    onChange={(e) => handleInputChange('pix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="CPF, telefone, email ou chave aleatória"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione o cargo...</option>
                    <option value="Enfermeira">Enfermeira</option>
                    <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                    <option value="Cuidador de Idosos">Cuidador de Idosos</option>
                    <option value="Auxiliar de Serviços Gerais">Auxiliar de Serviços Gerais</option>
                    <option value="Cozinheira">Cozinheira</option>
                    <option value="Nutricionista">Nutricionista</option>
                    <option value="Fisioterapeuta">Fisioterapeuta</option>
                    <option value="Psicóloga">Psicóloga</option>
                    <option value="Assistente Social">Assistente Social</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponível para Unidade(s) *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="Botafogo">Botafogo</option>
                    <option value="Tijuca">Tijuca</option>
                    <option value="Ambas">Ambas as Unidades</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Observações */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Observações
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                  placeholder="Informações sobre disponibilidade, especialidades, restrições..."
                />
              </div>
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
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {employee ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};