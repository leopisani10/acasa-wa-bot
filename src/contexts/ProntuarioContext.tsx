import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { MedicalRecord, VitalSign, ClinicalAssessment, DigitalSignature, MedicalRecordFilter } from '../types/prontuario';
import { useAuth } from './AuthContext';

interface ProntuarioContextType {
  medicalRecords: MedicalRecord[];
  loading: boolean;
  error: string | null;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lastEditBy' | 'lastEditAt'>) => Promise<void>;
  updateMedicalRecord: (id: string, record: Partial<MedicalRecord>) => Promise<void>;
  getMedicalRecord: (id: string) => MedicalRecord | undefined;
  getGuestRecords: (guestId: string, filter?: MedicalRecordFilter) => MedicalRecord[];
  signMedicalRecord: (recordId: string, signatureData: Omit<DigitalSignature, 'signedAt' | 'hash' | 'isValid'>) => Promise<void>;
  canEditRecord: (record: MedicalRecord) => boolean;
  exportRecordsToPDF: (guestId: string, dateFrom?: string, dateTo?: string) => void;
}

const ProntuarioContext = createContext<ProntuarioContextType | undefined>(undefined);

export const useProntuario = () => {
  const context = useContext(ProntuarioContext);
  if (context === undefined) {
    throw new Error('useProntuario must be used within a ProntuarioProvider');
  }
  return context;
};

interface ProntuarioProviderProps {
  children: ReactNode;
}

export const ProntuarioProvider: React.FC<ProntuarioProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMedicalRecords();
    }
  }, [user]);

  const fetchMedicalRecords = async () => {
    try {
      setError(null);
      // Por enquanto, usar localStorage até a migração ser aplicada
      const savedRecords = localStorage.getItem('acasa_medical_records');
      if (savedRecords) {
        setMedicalRecords(JSON.parse(savedRecords));
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setError('Erro ao carregar prontuários');
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (records: MedicalRecord[]) => {
    localStorage.setItem('acasa_medical_records', JSON.stringify(records));
  };

  const addMedicalRecord = async (recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lastEditBy' | 'lastEditAt'>) => {
    try {
      const userId = await getCurrentUserId();
      
      const newRecord: MedicalRecord = {
        ...recordData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocked: false,
        lastEditBy: userId || '',
        lastEditAt: new Date().toISOString(),
      };

      const updatedRecords = [...medicalRecords, newRecord];
      setMedicalRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw error;
    }
  };

  const updateMedicalRecord = async (id: string, recordData: Partial<MedicalRecord>) => {
    try {
      const userId = await getCurrentUserId();
      
      const updatedRecords = medicalRecords.map(record => {
        if (record.id === id && !record.isLocked) {
          return {
            ...record,
            ...recordData,
            updatedAt: new Date().toISOString(),
            lastEditBy: userId || '',
            lastEditAt: new Date().toISOString(),
          };
        }
        return record;
      });

      setMedicalRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  };

  const getMedicalRecord = (id: string) => {
    return medicalRecords.find(record => record.id === id);
  };

  const getGuestRecords = (guestId: string, filter?: MedicalRecordFilter) => {
    let records = medicalRecords.filter(record => record.guestId === guestId);

    if (filter) {
      if (filter.dateFrom) {
        records = records.filter(record => record.recordDate >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        records = records.filter(record => record.recordDate <= filter.dateTo!);
      }
      if (filter.author) {
        records = records.filter(record => 
          record.technicalResponsible.toLowerCase().includes(filter.author!.toLowerCase())
        );
      }
      if (filter.keyword) {
        records = records.filter(record => 
          record.observations.toLowerCase().includes(filter.keyword!.toLowerCase()) ||
          record.intercurrences.toLowerCase().includes(filter.keyword!.toLowerCase())
        );
      }
      if (filter.shiftType && filter.shiftType !== 'all') {
        records = records.filter(record => record.shiftType === filter.shiftType);
      }
    }

    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const signMedicalRecord = async (recordId: string, signatureData: Omit<DigitalSignature, 'signedAt' | 'hash' | 'isValid'>) => {
    try {
      const signature: DigitalSignature = {
        ...signatureData,
        signedAt: new Date().toISOString(),
        hash: btoa(`${recordId}-${signatureData.signerCpf}-${Date.now()}`), // Hash simples
        isValid: true,
      };

      const updatedRecords = medicalRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            digitalSignature: signature,
            isLocked: true,
            updatedAt: new Date().toISOString(),
          };
        }
        return record;
      });

      setMedicalRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
    } catch (error) {
      console.error('Error signing medical record:', error);
      throw error;
    }
  };

  const canEditRecord = (record: MedicalRecord): boolean => {
    if (record.isLocked) return false;
    
    // Só pode editar no mesmo dia até 23h59
    const recordDate = new Date(record.recordDate);
    const today = new Date();
    
    return recordDate.toDateString() === today.toDateString();
  };

  const exportRecordsToPDF = (guestId: string, dateFrom?: string, dateTo?: string) => {
    const records = getGuestRecords(guestId, { dateFrom, dateTo });
    
    // Gerar PDF (simulado)
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prontuário Eletrônico - ${records[0]?.guestName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #8B2C8A; padding-bottom: 10px; margin-bottom: 20px; }
            .record { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .signature { background-color: #f0f9ff; border: 1px solid #0ea5e9; padding: 10px; border-radius: 5px; margin-top: 10px; }
            .vital-signs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0; }
            .vital-item { text-align: center; padding: 5px; background-color: #f8f9fa; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACASA Residencial Sênior</h1>
            <h2>Prontuário Eletrônico</h2>
            <p>Paciente: ${records[0]?.guestName}</p>
            <p>Período: ${dateFrom || 'Início'} até ${dateTo || 'Hoje'}</p>
          </div>
          ${records.map(record => `
            <div class="record">
              <h3>${new Date(record.recordDate).toLocaleDateString('pt-BR')} - ${record.shiftType}</h3>
              <p><strong>Técnico:</strong> ${record.technicalResponsible}</p>
              ${record.vitalSigns.length > 0 ? `
                <h4>Sinais Vitais:</h4>
                <div class="vital-signs">
                  ${record.vitalSigns.map(vs => `
                    <div class="vital-item">
                      <strong>${vs.time}</strong><br>
                      PA: ${vs.bloodPressure}<br>
                      FC: ${vs.heartRate}<br>
                      FR: ${vs.respiratoryRate}<br>
                      T: ${vs.temperature}°C<br>
                      SatO2: ${vs.oxygenSaturation}%<br>
                      Glicemia: ${vs.capillaryGlycemia}<br>
                      Dor: ${vs.painScale}/10
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              <p><strong>Observações:</strong> ${record.observations}</p>
              <p><strong>Intercorrências:</strong> ${record.intercurrences}</p>
              <div class="signature">
                <p><strong>Assinatura Digital:</strong> ${record.digitalSignature.signerName}</p>
                <p>Assinado em: ${new Date(record.digitalSignature.signedAt).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const value = {
    medicalRecords,
    loading,
    error,
    addMedicalRecord,
    updateMedicalRecord,
    getMedicalRecord,
    getGuestRecords,
    signMedicalRecord,
    canEditRecord,
    exportRecordsToPDF,
  };

  return <ProntuarioContext.Provider value={value}>{children}</ProntuarioContext.Provider>;
};