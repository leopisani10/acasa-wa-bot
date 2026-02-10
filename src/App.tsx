import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuestProvider } from './contexts/GuestContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { SobreavisoProvider } from './contexts/SobreavisoContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { CertificateProvider } from './contexts/CertificateContext';
import { NFRDAProvider } from './contexts/NFRDAContext';
import { AgravosProvider } from './contexts/AgravosContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { GuestList } from './components/guests/GuestList';
import { GuestForm } from './components/guests/GuestForm';
import { EmployeeList } from './components/employees/EmployeeList';
import { EmployeeForm } from './components/employees/EmployeeForm';
import { ScheduleManager } from './components/schedule/ScheduleManager';
import { DocumentList } from './components/documents/DocumentList';
import { DocumentForm } from './components/documents/DocumentForm';
import { RevisionForm } from './components/documents/RevisionForm';
import { CertificateList } from './components/certificates/CertificateList';
import { CertificateForm } from './components/certificates/CertificateForm';
import { NFRDAList } from './components/nfrda/NFRDAList';
import { NFRDAForm } from './components/nfrda/NFRDAForm';
import { EscalaKatz } from './components/escala-katz/EscalaKatz';
import { Agravos } from './components/agravos/Agravos';
import { SobreavisoList } from './components/sobreaviso/SobreavisoList';
import { SobreavisoForm } from './components/sobreaviso/SobreavisoForm';
import { ProfileForm } from './components/profile/ProfileForm';
import { CardapioManager } from './components/cardapio/CardapioManager';
import { CardapioProvider } from './contexts/CardapioContext';
import { ProntuarioMain } from './components/prontuario/ProntuarioMain';
import { UserManagement } from './components/users/UserManagement';
import { UserManagementProvider } from './contexts/UserManagementContext';
import { CRMProvider } from './contexts/CRMContext';
import { LeadsList } from './components/crm/LeadsList';
import { Pipeline } from './components/crm/Pipeline';
import { CRMInbox } from './components/crm/CRMInbox';
import { CRMReports } from './components/crm/CRMReports';
import { TransportationVoucherProvider } from './contexts/TransportationVoucherContext';
import { TransportationVoucherList } from './components/transportation-voucher/TransportationVoucherList';
import { PayrollProvider } from './contexts/PayrollContext';
import { PayrollManager } from './components/payroll/PayrollManager';
import { LaborAgreementProvider } from './contexts/LaborAgreementContext';
import { LaborAgreementManager } from './components/labor-agreements/LaborAgreementManager';
import { RoomProvider } from './contexts/RoomContext';
import RoomManager from './components/rooms/RoomManager';
import { FinancialProvider } from './contexts/FinancialContext';
import { FinancialPasswordModal } from './components/financial/FinancialPasswordModal';
import { FinancialDashboard } from './components/financial/FinancialDashboard';
import { Guest, Employee, DocumentTemplate, Certificate, NFRDAEntry, SobreavisoEmployee } from './types';

function App() {
  const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [editingGuest, setEditingGuest] = useState<Guest | undefined>();
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
    const [showDocumentForm, setShowDocumentForm] = useState(false);
    const [editingDocument, setEditingDocument] = useState<DocumentTemplate | undefined>();
    const [showRevisionForm, setShowRevisionForm] = useState(false);
    const [revisionDocument, setRevisionDocument] = useState<DocumentTemplate | undefined>();
    const [showCertificateForm, setShowCertificateForm] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState<Certificate | undefined>();
    const [showNFRDAForm, setShowNFRDAForm] = useState(false);
    const [editingNFRDA, setEditingNFRDA] = useState<NFRDAEntry | undefined>();
    const [showSobreavisoForm, setShowSobreavisoForm] = useState(false);
    const [editingSobreaviso, setEditingSobreaviso] = useState<SobreavisoEmployee | undefined>();
    const [showFinancialPassword, setShowFinancialPassword] = useState(false);
    const [financialUnlocked, setFinancialUnlocked] = useState(false);

    const handleAddGuest = () => {
      setEditingGuest(undefined);
      setShowGuestForm(true);
    };

    const handleEditGuest = (guest: Guest) => {
      setEditingGuest(guest);
      setShowGuestForm(true);
    };

    const handleCloseGuestForm = () => {
      setShowGuestForm(false);
      setEditingGuest(undefined);
    };

    const handleSaveGuest = () => {
      setActiveView('guests');
    };

    const handleAddEmployee = () => {
      setEditingEmployee(undefined);
      setShowEmployeeForm(true);
    };

    const handleEditEmployee = (employee: Employee) => {
      setEditingEmployee(employee);
      setShowEmployeeForm(true);
    };

    const handleCloseEmployeeForm = () => {
      setShowEmployeeForm(false);
      setEditingEmployee(undefined);
    };

    const handleSaveEmployee = () => {
      setActiveView('employees');
    };

    const handleAddDocument = () => {
      setEditingDocument(undefined);
      setShowDocumentForm(true);
    };

    const handleEditDocument = (document: DocumentTemplate) => {
      setEditingDocument(document);
      setShowDocumentForm(true);
    };

    const handleNewRevision = (document: DocumentTemplate) => {
      setRevisionDocument(document);
      setShowRevisionForm(true);
    };

    const handleCloseDocumentForm = () => {
      setShowDocumentForm(false);
      setEditingDocument(undefined);
    };

    const handleCloseRevisionForm = () => {
      setShowRevisionForm(false);
      setRevisionDocument(undefined);
    };

    const handleSaveDocument = () => {
      setActiveView('documents');
    };

    const handleAddCertificate = () => {
      setEditingCertificate(undefined);
      setShowCertificateForm(true);
    };

    const handleEditCertificate = (certificate: Certificate) => {
      setEditingCertificate(certificate);
      setShowCertificateForm(true);
    };

    const handleCloseCertificateForm = () => {
      setShowCertificateForm(false);
      setEditingCertificate(undefined);
    };

    const handleSaveCertificate = () => {
      setActiveView('certificates');
    };

    const handleAddNFRDA = () => {
      setEditingNFRDA(undefined);
      setShowNFRDAForm(true);
    };

    const handleEditNFRDA = (entry: NFRDAEntry) => {
      setEditingNFRDA(entry);
      setShowNFRDAForm(true);
    };

    const handleCloseNFRDAForm = () => {
      setShowNFRDAForm(false);
      setEditingNFRDA(undefined);
    };

    const handleSaveNFRDA = () => {
      setActiveView('nfrda');
    };

    const handleAddSobreaviso = () => {
      setEditingSobreaviso(undefined);
      setShowSobreavisoForm(true);
    };

    const handleEditSobreaviso = (employee: SobreavisoEmployee) => {
      setEditingSobreaviso(employee);
      setShowSobreavisoForm(true);
    };

    const handleCloseSobreavisoForm = () => {
      setShowSobreavisoForm(false);
      setEditingSobreaviso(undefined);
    };

    const handleSaveSobreaviso = () => {
      setActiveView('sobreaviso');
    };

    const handleFinancialAccess = () => {
      if (!financialUnlocked) {
        setShowFinancialPassword(true);
      } else {
        setActiveView('financial');
      }
    };

    const handleFinancialUnlock = () => {
      setFinancialUnlocked(true);
      setShowFinancialPassword(false);
      setActiveView('financial');
    };

    if (isLoading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acasa-purple"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <LoginForm isLogin={isLogin} onToggleMode={() => setIsLogin(!isLogin)} />
        </div>
      );
    }

    return (
      <GuestProvider>
        <EmployeeProvider>
          <ScheduleProvider>
            <SobreavisoProvider>
              <DocumentProvider>
                <CertificateProvider>
                  <NFRDAProvider>
                    <AgravosProvider>
                      <CardapioProvider>
                        <UserManagementProvider>
                        <CRMProvider>
                        <TransportationVoucherProvider>
                        <PayrollProvider>
                        <LaborAgreementProvider>
                        <RoomProvider>
                        <FinancialProvider>
                        <div className="min-h-screen bg-gray-50 lg:flex lg:overflow-hidden">
                          <div className={`lg:flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
                            <Header
                              activeView={activeView}
                              onViewChange={setActiveView}
                              sidebarCollapsed={sidebarCollapsed}
                              setSidebarCollapsed={setSidebarCollapsed}
                              onFinancialClick={handleFinancialAccess}
                            />
                          </div>
                          
                          <div className="flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ease-in-out">
                            {/* Desktop header */}
                            <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-6 py-2">
                              <div className="text-center">
                                <h1 className="text-sm font-medium text-gray-800">
                                  ACASA<span className="text-acasa-purple">.Hub</span> • Gestão Integrada: CRM + ERP + Compliance
                                </h1>
                              </div>
                            </div>
                            
                            <main className="flex-1 px-4 sm:px-6 lg:px-6 py-6 min-h-0 overflow-y-auto">
                              {activeView === 'dashboard' && <Dashboard />}
                              {activeView === 'guests' && (
                                <GuestList onAddGuest={handleAddGuest} onEditGuest={handleEditGuest} />
                              )}
                              {activeView === 'employees' && (
                                <EmployeeList onAddEmployee={handleAddEmployee} onEditEmployee={handleEditEmployee} />
                              )}
                              {activeView === 'schedules' && <ScheduleManager />}
                              {activeView === 'sobreaviso' && (
                                <SobreavisoList onAddEmployee={handleAddSobreaviso} onEditEmployee={handleEditSobreaviso} />
                              )}
                              {activeView === 'documents' && (
                                <DocumentList 
                                  onAddDocument={handleAddDocument} 
                                  onEditDocument={handleEditDocument}
                                  onNewRevision={handleNewRevision}
                                />
                              )}
                              {activeView === 'certificates' && (
                                <CertificateList onAddCertificate={handleAddCertificate} onEditCertificate={handleEditCertificate} />
                              )}
                              {activeView === 'katz' && <EscalaKatz />}
                              {activeView === 'agravos' && <Agravos />}
                              {activeView === 'nfrda' && (
                                <NFRDAList onAddEntry={handleAddNFRDA} onEditEntry={handleEditNFRDA} />
                              )}
                              {activeView === 'prontuario' && <ProntuarioMain />}
                              {activeView === 'cardapio' && <CardapioManager />}
                              {activeView === 'profile' && <ProfileForm />}
                              {activeView === 'users' && <UserManagement />}
                              {activeView === 'crm-leads' && <LeadsList />}
                              {activeView === 'crm-pipeline' && <Pipeline />}
                              {activeView === 'crm-inbox' && <CRMInbox />}
                              {activeView === 'crm-reports' && <CRMReports />}
                              {activeView === 'transportation-voucher' && <TransportationVoucherList />}
                              {activeView === 'payroll' && <PayrollManager />}
                              {activeView === 'labor-agreements' && <LaborAgreementManager />}
                              {activeView === 'rooms' && <RoomManager />}
                              {activeView === 'financial' && financialUnlocked && <FinancialDashboard />}
                            </main>
                          </div>
                        </div>

                        {showGuestForm && (
                          <GuestForm
                            guest={editingGuest}
                            onClose={handleCloseGuestForm}
                            onSave={handleSaveGuest}
                          />
                        )}

                        {showEmployeeForm && (
                          <EmployeeForm
                            employee={editingEmployee}
                            onClose={handleCloseEmployeeForm}
                            onSave={handleSaveEmployee}
                          />
                        )}

                        {showDocumentForm && (
                          <DocumentForm
                            document={editingDocument}
                            onClose={handleCloseDocumentForm}
                            onSave={handleSaveDocument}
                          />
                        )}

                        {showRevisionForm && revisionDocument && (
                          <RevisionForm
                            document={revisionDocument}
                            onClose={handleCloseRevisionForm}
                            onSave={handleSaveDocument}
                          />
                        )}

                        {showCertificateForm && (
                          <CertificateForm
                            certificate={editingCertificate}
                            onClose={handleCloseCertificateForm}
                            onSave={handleSaveCertificate}
                          />
                        )}

                        {showNFRDAForm && (
                          <NFRDAForm
                            entry={editingNFRDA}
                            onClose={handleCloseNFRDAForm}
                            onSave={handleSaveNFRDA}
                          />
                        )}

                        {showSobreavisoForm && (
                          <SobreavisoForm
                            employee={editingSobreaviso}
                            onClose={handleCloseSobreavisoForm}
                            onSave={handleSaveSobreaviso}
                          />
                        )}

                        {showFinancialPassword && (
                          <FinancialPasswordModal
                            onSuccess={handleFinancialUnlock}
                            onClose={() => setShowFinancialPassword(false)}
                          />
                        )}
                        </FinancialProvider>
                        </RoomProvider>
                        </LaborAgreementProvider>
                        </PayrollProvider>
                        </TransportationVoucherProvider>
                        </CRMProvider>
                        </UserManagementProvider>
                      </CardapioProvider>
                    </AgravosProvider>
                  </NFRDAProvider>
                </CertificateProvider>
              </DocumentProvider>
            </SobreavisoProvider>
          </ScheduleProvider>
        </EmployeeProvider>
      </GuestProvider>
    );
  };

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;