import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { Certificate } from '../types';

interface CertificateHistory {
  id: string;
  certificateId: string;
  executedDate: string;
  expiryDate: string;
  certificateUrl: string | null;
  responsible: string;
  observations: string | null;
  replacedAt: string;
  replacedBy: string;
}

interface CertificateContextType {
  certificates: Certificate[];
  addCertificate: (certificate: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate' | 'status'>) => Promise<void>;
  updateCertificate: (id: string, certificate: Partial<Certificate>) => Promise<void>;
  deleteCertificate: (id: string) => Promise<void>;
  getCertificate: (id: string) => Certificate | undefined;
  getCertificateHistory: (certificateId: string) => Promise<CertificateHistory[]>;
  getExpiringCertificates: () => ExpiringCertificate[];
}

interface ExpiringCertificate {
  id: string;
  service: string;
  unit: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'warning' | 'danger';
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export const useCertificates = () => {
  const context = useContext(CertificateContext);
  if (context === undefined) {
    throw new Error('useCertificates must be used within a CertificateProvider');
  }
  return context;
};

interface CertificateProviderProps {
  children: ReactNode;
}

export const CertificateProvider: React.FC<CertificateProviderProps> = ({ children }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      const transformedCertificates: Certificate[] = data.map(cert => ({
        id: cert.id,
        service: cert.service,
        unit: cert.unit,
        executedDate: cert.executed_date,
        expiryDate: cert.expiry_date,
        currentCertificate: cert.current_certificate || '',
        responsible: cert.responsible,
        observations: cert.observations || '',
        status: calculateStatus(cert.expiry_date, cert.current_certificate),
        lastUpdate: cert.last_update,
        createdAt: cert.created_at,
        updatedAt: cert.updated_at,
      }));

      setCertificates(transformedCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (expiryDate: string, currentCertificate: string | null): 'Em dia' | 'Próximo ao vencimento' | 'Vencido' | 'Pendente' => {
    if (!currentCertificate || currentCertificate === '') {
      return 'Pendente';
    }

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Vencido';
    } else if (diffDays <= 30) {
      return 'Próximo ao vencimento';
    } else {
      return 'Em dia';
    }
  };

  const addCertificate = async (certificateData: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate' | 'status'>) => {
    try {
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from('certificates')
        .insert([{
          service: certificateData.service,
          unit: certificateData.unit,
          executed_date: certificateData.executedDate,
          expiry_date: certificateData.expiryDate,
          current_certificate: certificateData.currentCertificate || null,
          responsible: certificateData.responsible,
          observations: certificateData.observations || null,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding certificate:', error);
        throw new Error(`Erro ao adicionar certificado: ${error.message}`);
      }

      console.log('Certificate added successfully:', data);
      await fetchCertificates();
    } catch (error) {
      console.error('Error adding certificate:', error);
      throw error;
    }
  };

  const updateCertificate = async (id: string, certificateData: Partial<Certificate>) => {
    try {
      const updateData: any = {};

      if (certificateData.service !== undefined) updateData.service = certificateData.service;
      if (certificateData.unit !== undefined) updateData.unit = certificateData.unit;
      if (certificateData.executedDate !== undefined) updateData.executed_date = certificateData.executedDate;
      if (certificateData.expiryDate !== undefined) updateData.expiry_date = certificateData.expiryDate;
      if (certificateData.currentCertificate !== undefined) updateData.current_certificate = certificateData.currentCertificate || null;
      if (certificateData.responsible !== undefined) updateData.responsible = certificateData.responsible;
      if (certificateData.observations !== undefined) updateData.observations = certificateData.observations || null;

      const { error } = await supabase
        .from('certificates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating certificate:', error);
        throw new Error(`Erro ao atualizar certificado: ${error.message}`);
      }

      await fetchCertificates();
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  };

  const deleteCertificate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCertificates();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  };

  const getCertificate = (id: string) => {
    return certificates.find(cert => cert.id === id);
  };

  const getCertificateHistory = async (certificateId: string): Promise<CertificateHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('certificate_history')
        .select('*')
        .eq('certificate_id', certificateId)
        .order('replaced_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        certificateId: item.certificate_id,
        executedDate: item.executed_date,
        expiryDate: item.expiry_date,
        certificateUrl: item.certificate_url,
        responsible: item.responsible,
        observations: item.observations,
        replacedAt: item.replaced_at,
        replacedBy: item.replaced_by,
      }));
    } catch (error) {
      console.error('Error fetching certificate history:', error);
      return [];
    }
  };

  const getExpiringCertificates = (): ExpiringCertificate[] => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    return certificates
      .filter(cert => {
        const expiryDate = new Date(cert.expiryDate);
        return expiryDate <= thirtyDaysFromNow;
      })
      .map(cert => {
        const expiryDate = new Date(cert.expiryDate);
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: cert.id,
          service: cert.service,
          unit: cert.unit,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          status: daysUntilExpiry < 0 ? 'danger' : 'warning',
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  const value = {
    certificates,
    addCertificate,
    updateCertificate,
    deleteCertificate,
    getCertificate,
    getCertificateHistory,
    getExpiringCertificates,
  };

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
};
