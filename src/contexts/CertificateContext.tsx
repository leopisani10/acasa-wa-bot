import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Certificate } from '../types';

interface CertificateContextType {
  certificates: Certificate[];
  addCertificate: (certificate: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate'>) => void;
  updateCertificate: (id: string, certificate: Partial<Certificate>) => void;
  deleteCertificate: (id: string) => void;
  getCertificate: (id: string) => Certificate | undefined;
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

  useEffect(() => {
    const savedCertificates = localStorage.getItem('acasa_certificates');
    if (savedCertificates) {
      setCertificates(JSON.parse(savedCertificates));
    }
  }, []);

  const saveCertificates = (updatedCertificates: Certificate[]) => {
    setCertificates(updatedCertificates);
    localStorage.setItem('acasa_certificates', JSON.stringify(updatedCertificates));
  };

  const updateCertificateStatus = (certificate: Certificate): Certificate => {
    const today = new Date();
    const expiryDate = new Date(certificate.expiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: 'Em dia' | 'Pendente' | 'Atrasado';
    if (diffDays < 0) {
      status = 'Atrasado';
    } else if (diffDays <= 30) {
      status = 'Pendente';
    } else {
      status = 'Em dia';
    }

    return { ...certificate, status };
  };

  const addCertificate = (certificateData: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate'>) => {
    const newCertificate: Certificate = {
      ...certificateData,
      id: Date.now().toString(),
      lastUpdate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const certificateWithStatus = updateCertificateStatus(newCertificate);
    const updatedCertificates = [...certificates, certificateWithStatus];
    saveCertificates(updatedCertificates);
  };

  const updateCertificate = (id: string, certificateData: Partial<Certificate>) => {
    const updatedCertificates = certificates.map(cert => {
      if (cert.id === id) {
        const updated = { 
          ...cert, 
          ...certificateData, 
          lastUpdate: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        };
        return updateCertificateStatus(updated);
      }
      return cert;
    });
    saveCertificates(updatedCertificates);
  };

  const deleteCertificate = (id: string) => {
    const updatedCertificates = certificates.filter(cert => cert.id !== id);
    saveCertificates(updatedCertificates);
  };

  const getCertificate = (id: string) => {
    return certificates.find(cert => cert.id === id);
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
    getExpiringCertificates,
  };

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
};