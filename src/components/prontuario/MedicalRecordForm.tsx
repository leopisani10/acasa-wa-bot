import React, { useState } from 'react';
import { Save, X, Plus, Trash2, Clock, Activity, Stethoscope, PenTool } from 'lucide-react';
import { MedicalRecord, VitalSign, ClinicalAssessment } from '../../types/prontuario';
import { useProntuario } from '../../contexts/ProntuarioContext';
import { useAuth } from '../../contexts/AuthContext';
import { Guest } from '../../types';

interface MedicalRecordFormProps {
  guest: Guest;
  onClose: () => void;
  onSave: () => void;
}

export const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({ guest, onClose, onSave }) => {
  const { addMedicalRecord, signMedicalRecord } = useProntuario();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [formData, setFormData] = useState<Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lastEditBy' | 'lastEditAt' | 'digitalSignature'>>({
    guestId: guest.id,
    guestName: guest.fullName,
    recordDate: new Date().toISOString().split('T')[0],
    shiftType: new Date().getHours() < 19 ? 'SD' : 'SN',
    technicalResponsible: user?.name || '',
    technicalResponsibleId: user?.id || '',
    unit: guest.unit,
    
    vitalSigns: [],
    
    clinicalAssessment: {
      consciousnessLevel: 'Lúcido',
      locomotorApparatus: 'Deambulando',
      feeding: {
        route: 'Oral',
        dietType: 'Branda',
        thickener: false,
      },
      pressureInjury: {
        present: false,
        dressing: false,
      },
      elimination: {
        normal: true,
      },
      allergy: {
        present: false,
      },
    },
    
    observations: '',
    intercurrences: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClinicalAssessmentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      clinicalAssessment: {
        ...prev.clinicalAssessment,
        [field]: value,
      },
    }));
  };

  const handleNestedClinicalChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      clinicalAssessment: {
        ...prev.clinicalAssessment,
        [parent]: {
          ...prev.clinicalAssessment[parent as keyof ClinicalAssessment],
          [field]: value,
        },
      },
    }));
  };

  const addVitalSign = () => {
    const newVitalSign: VitalSign = {
      id: Date.now().toString(),
      time: new Date().toTimeString().slice(0, 5),
      bloodPressure: '',
      heartRate: 0,
      respiratoryRate: 0,
      temperature: 36.5,
      oxygenSaturation: 98,
      capillaryGlycemia: 0,
      painScale: 0,
      notes: '',
    };

    setFormData(prev => ({
      ...prev,
      vitalSigns: [...prev.vitalSigns, newVitalSign],
    }));
  };

  const updateVitalSign = (vitalId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: prev.vitalSigns.map(vital =>
        vital.id === vitalId ? { ...vital, [field]: value } : vital
      ),
    }));
  };

  const removeVitalSign = (vitalId: string) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: prev.vitalSigns.filter(vital => vital.id !== vitalId),
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Salvar o prontuário primeiro
      await addMedicalRecord(formData);
      setShowSignatureModal(true);
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      alert('Erro ao salvar prontuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async (password: string) => {
    try {
      // Simular assinatura digital
      const signatureData = {
        signatureType: 'institutional' as const,
        signerCpf: user?.id || '', // Usar ID como CPF simulado
        signerName: user?.name || '',
        signerRegistry: '', // COREN, etc. (seria preenchido do perfil)
        institutionStamp: 'ACASA Residencial Sênior - CRM/RJ: XXXXX',
      };

      // Buscar o último registro adicionado para assinar
      const lastRecordId = Date.now().toString(); // Seria o ID retornado do addMedicalRecord
      
      await signMedicalRecord(lastRecordId, signatureData);
      
      setShowSignatureModal(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao assinar prontuário:', error);
      alert('Erro ao assinar prontuário. Tente novamente.');
    }
  };

  const canEditToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return formData.recordDate === today;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-sans">Nova Anotação de Enfermagem</h2>
              <h2 className="text-2xl font-bold text-gray-900 font-sans">Nova Evolução de Técnico de Enfermagem</h2>
              <p className="text-gray-600 font-sans">
                Paciente: <strong>{guest.fullName}</strong> • Quarto {guest.roomNumber}
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
            <div className="space-y-8">
              {/* Identificação do Plantão */}
              <section className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center font-sans">
                  <Clock className="mr-2 text-blue-600" size={20} />
                  Identificação do Plantão
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Data</label>
                    <input
                      type="date"
                      value={formData.recordDate}
                      onChange={(e) => handleInputChange('recordDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                      disabled={!canEditToday()}
                    />
                    {!canEditToday() && (
                      <p className="text-xs text-red-600 mt-1 font-sans">Só é possível editar no mesmo dia</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Plantão</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="shiftType"
                          value="SD"
                          checked={formData.shiftType === 'SD'}
                          onChange={(e) => handleInputChange('shiftType', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm font-sans">SD</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="shiftType"
                          value="SN"
                          checked={formData.shiftType === 'SN'}
                          onChange={(e) => handleInputChange('shiftType', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm font-sans">SN</span>
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Técnico Responsável</label>
                    <input
                      type="text"
                      value={formData.technicalResponsible}
                      onChange={(e) => handleInputChange('technicalResponsible', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Sinais Vitais */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center font-sans">
                    <Activity className="mr-2 text-red-600" size={20} />
                    Sinais Vitais
                  </h3>
                  <button
                    type="button"
                    onClick={addVitalSign}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-sans"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar Horário
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.vitalSigns.map((vital) => (
                    <div key={vital.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">Hora</label>
                          <input
                            type="time"
                            value={vital.time}
                            onChange={(e) => updateVitalSign(vital.id, 'time', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">PA</label>
                          <input
                            type="text"
                            value={vital.bloodPressure}
                            onChange={(e) => updateVitalSign(vital.id, 'bloodPressure', e.target.value)}
                            placeholder="120x80"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">FC</label>
                          <input
                            type="number"
                            value={vital.heartRate || ''}
                            onChange={(e) => updateVitalSign(vital.id, 'heartRate', parseInt(e.target.value) || 0)}
                            placeholder="bpm"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">FR</label>
                          <input
                            type="number"
                            value={vital.respiratoryRate || ''}
                            onChange={(e) => updateVitalSign(vital.id, 'respiratoryRate', parseInt(e.target.value) || 0)}
                            placeholder="rpm"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">TAX</label>
                          <input
                            type="number"
                            step="0.1"
                            value={vital.temperature || ''}
                            onChange={(e) => updateVitalSign(vital.id, 'temperature', parseFloat(e.target.value) || 0)}
                            placeholder="°C"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">SatO2</label>
                          <input
                            type="number"
                            value={vital.oxygenSaturation || ''}
                            onChange={(e) => updateVitalSign(vital.id, 'oxygenSaturation', parseInt(e.target.value) || 0)}
                            placeholder="%"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">Glicemia</label>
                          <input
                            type="number"
                            value={vital.capillaryGlycemia || ''}
                            onChange={(e) => updateVitalSign(vital.id, 'capillaryGlycemia', parseInt(e.target.value) || 0)}
                            placeholder="mg/dL"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeVitalSign(vital.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Remover horário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">Escala de Dor (0-10)</label>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={vital.painScale}
                            onChange={(e) => updateVitalSign(vital.id, 'painScale', parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="text-center text-sm font-bold text-red-600 font-sans">{vital.painScale}/10</div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">Observações</label>
                          <input
                            type="text"
                            value={vital.notes || ''}
                            onChange={(e) => updateVitalSign(vital.id, 'notes', e.target.value)}
                            placeholder="Observações específicas..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.vitalSigns.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-600 font-sans">Clique em "Adicionar Horário" para registrar sinais vitais</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Avaliações Clínicas */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center font-sans">
                  <Stethoscope className="mr-2 text-green-600" size={20} />
                  Avaliações Clínicas
                </h3>

                <div className="space-y-6">
                  {/* Nível de Consciência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">Nível de Consciência</label>
                    <div className="flex flex-wrap gap-4">
                      {['Lúcido', 'Orientado', 'Algo orientado', 'Irresponsivo'].map(level => (
                        <label key={level} className="flex items-center">
                          <input
                            type="radio"
                            name="consciousnessLevel"
                            value={level}
                            checked={formData.clinicalAssessment.consciousnessLevel === level}
                            onChange={(e) => handleClinicalAssessmentChange('consciousnessLevel', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Aparelho Locomotor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">Aparelho Locomotor</label>
                    <div className="flex flex-wrap gap-4">
                      {['Deambulando', 'Com auxílio', 'Acamado'].map(status => (
                        <label key={status} className="flex items-center">
                          <input
                            type="radio"
                            name="locomotorApparatus"
                            value={status}
                            checked={formData.clinicalAssessment.locomotorApparatus === status}
                            onChange={(e) => handleClinicalAssessmentChange('locomotorApparatus', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Alimentação */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">Alimentação</label>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700 mr-4 font-sans">Via:</span>
                        {['Oral', 'Gastrostomia', 'Jejunostomia'].map(route => (
                          <label key={route} className="inline-flex items-center mr-4">
                            <input
                              type="radio"
                              name="feedingRoute"
                              value={route}
                              checked={formData.clinicalAssessment.feeding.route === route}
                              onChange={(e) => handleNestedClinicalChange('feeding', 'route', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm font-sans">{route}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 mr-4 font-sans">Dieta:</span>
                        {['Pastosa', 'Branda'].map(diet => (
                          <label key={diet} className="inline-flex items-center mr-4">
                            <input
                              type="radio"
                              name="dietType"
                              value={diet}
                              checked={formData.clinicalAssessment.feeding.dietType === diet}
                              onChange={(e) => handleNestedClinicalChange('feeding', 'dietType', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-sm font-sans">{diet}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.clinicalAssessment.feeding.thickener}
                            onChange={(e) => handleNestedClinicalChange('feeding', 'thickener', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium font-sans">Espessante</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Lesão por Pressão */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">Lesão por Pressão</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pressureInjury"
                            checked={formData.clinicalAssessment.pressureInjury.present}
                            onChange={(e) => handleNestedClinicalChange('pressureInjury', 'present', true)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">Sim</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pressureInjury"
                            checked={!formData.clinicalAssessment.pressureInjury.present}
                            onChange={(e) => handleNestedClinicalChange('pressureInjury', 'present', false)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">Não</span>
                        </label>
                      </div>
                      
                      {formData.clinicalAssessment.pressureInjury.present && (
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.clinicalAssessment.pressureInjury.dressing}
                              onChange={(e) => handleNestedClinicalChange('pressureInjury', 'dressing', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium font-sans">Curativo realizado</span>
                          </label>
                          <input
                            type="text"
                            value={formData.clinicalAssessment.pressureInjury.location || ''}
                            onChange={(e) => handleNestedClinicalChange('pressureInjury', 'location', e.target.value)}
                            placeholder="Localização da lesão..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Eliminação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">Eliminação Vesico-Intestinal</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="elimination"
                            checked={formData.clinicalAssessment.elimination.normal}
                            onChange={(e) => handleNestedClinicalChange('elimination', 'normal', true)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">Normal</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="elimination"
                            checked={!formData.clinicalAssessment.elimination.normal}
                            onChange={(e) => handleNestedClinicalChange('elimination', 'normal', false)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">Alteração</span>
                        </label>
                      </div>
                      
                      {!formData.clinicalAssessment.elimination.normal && (
                        <input
                          type="text"
                          value={formData.clinicalAssessment.elimination.alteration || ''}
                          onChange={(e) => handleNestedClinicalChange('elimination', 'alteration', e.target.value)}
                          placeholder="Descreva a alteração..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans"
                        />
                      )}
                    </div>
                  </div>

                  {/* Alergia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 font-sans">Alergia</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="allergy"
                            checked={formData.clinicalAssessment.allergy.present}
                            onChange={(e) => handleNestedClinicalChange('allergy', 'present', true)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">Sim</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="allergy"
                            checked={!formData.clinicalAssessment.allergy.present}
                            onChange={(e) => handleNestedClinicalChange('allergy', 'present', false)}
                            className="mr-2"
                          />
                          <span className="text-sm font-sans">Não</span>
                        </label>
                      </div>
                      
                      {formData.clinicalAssessment.allergy.present && (
                        <input
                          type="text"
                          value={formData.clinicalAssessment.allergy.description || ''}
                          onChange={(e) => handleNestedClinicalChange('allergy', 'description', e.target.value)}
                          placeholder="Descreva a alergia..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Observações e Intercorrências */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center font-sans">
                  <PenTool className="mr-2 text-purple-600" size={20} />
                  Observações e Intercorrências
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Observações Gerais</label>
                    <textarea
                      value={formData.observations}
                      onChange={(e) => handleInputChange('observations', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-sans"
                      rows={4}
                      placeholder="Observações sobre o estado geral do paciente..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Intercorrências</label>
                    <textarea
                      value={formData.intercurrences}
                      onChange={(e) => handleInputChange('intercurrences', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-sans"
                      rows={4}
                      placeholder="Descreva intercorrências ou eventos adversos..."
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-sans"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Salvar e Assinar
            </button>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <PenTool className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">Assinatura Digital</h3>
                <p className="text-gray-600 font-sans">Confirme sua senha para assinar digitalmente o prontuário</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Técnico Responsável</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Senha de Confirmação</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSign((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-sans"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                    if (passwordInput && passwordInput.value) {
                      handleSign(passwordInput.value);
                    } else {
                      alert('Digite sua senha para confirmar a assinatura');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans"
                >
                  Assinar
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center font-sans">
                ⚠️ Após a assinatura, o prontuário não poderá mais ser editado
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};