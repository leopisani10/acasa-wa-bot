import React, { useState } from 'react';
import { LogOut, User, Home, Menu, FileText, Users, FileCheck, Receipt, Settings, Clipboard, AlertTriangle, Calendar, Clock, ChefHat, ChevronLeft, ChevronRight, UserCog, UserPlus, Kanban, MessageCircle, BarChart3, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, sidebarCollapsed, setSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crmExpanded, setCrmExpanded] = useState(
    activeView.startsWith('crm-') // Auto-expand if on CRM page
  );

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    // Mostrar diferentes menus baseado no papel do usuário
    ...(user?.role === 'admin' ? [
      { key: 'guests', label: 'Hóspedes', icon: User },
      { key: 'employees', label: 'Colaboradores', icon: Users },
    ] : []),
    // Menu para profissionais de saúde (enfermagem, médicos, etc.)
    ...((user?.position?.toLowerCase().includes('enfermagem') || 
         user?.position?.toLowerCase().includes('técnico') ||
         user?.position?.toLowerCase().includes('enfermeira') ||
         user?.position?.toLowerCase().includes('médico') ||
         user?.position?.toLowerCase().includes('fisioterapeuta') ||
         user?.position?.toLowerCase().includes('nutricionista') ||
         user?.position?.toLowerCase().includes('psicóloga') ||
         user?.position?.toLowerCase().includes('assistente social') ||
         user?.role === 'admin') ? [
      { key: 'prontuario', label: 'Prontuário Eletrônico', icon: FileText },
    ] : []),
    { key: 'schedules', label: 'Escalas', icon: Calendar },
    { key: 'sobreaviso', label: 'Banco de Talentos', icon: Clock },
    { key: 'cardapio', label: 'Cardápio', icon: ChefHat },
    // Menus administrativos só para admins
    ...(user?.role === 'admin' ? [
      { key: 'documents', label: 'Modelos', icon: FileText },
      { key: 'katz', label: 'Escala de Katz', icon: Clipboard },
      { key: 'agravos', label: 'Agravos', icon: AlertTriangle },
      { key: 'certificates', label: 'Certificados', icon: FileCheck },
      { key: 'nfrda', label: 'NF + RDA', icon: Receipt },
    ] : []),
    { key: 'profile', label: 'Meu Perfil', icon: Settings },
    // Menu de usuários só para admins
    ...(user?.role === 'admin' ? [
      { key: 'users', label: 'Usuários', icon: UserCog },
    ] : []),
  ];

  const crmItems = user?.role === 'admin' ? [
    { key: 'crm-leads', label: 'Leads', icon: UserPlus },
    { key: 'crm-pipeline', label: 'Pipeline', icon: Kanban },
    { key: 'crm-inbox', label: 'Inbox', icon: MessageCircle },
    { key: 'crm-reports', label: 'Relatórios', icon: BarChart3 },
  ] : [];

  const handleCRMToggle = () => {
    if (!sidebarCollapsed) {
      setCrmExpanded(!crmExpanded);
    }
  };

  const handleNavClick = (key: string) => {
    if (key.startsWith('crm-')) {
      setCrmExpanded(true);
    }
    onViewChange(key);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:translate-x-0 lg:relative lg:h-screen lg:sticky lg:top-0`}>
        <div className="flex flex-col h-full">
          {/* Collapse Toggle (Desktop Only) */}
          <div className="hidden lg:flex justify-end p-2 border-b border-gray-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'px-2 justify-center' : 'px-3'} py-2 rounded-lg font-medium transition-all text-left text-sm ${
                    activeView === item.key
                      ? 'bg-purple-100 text-acasa-purple shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} className={sidebarCollapsed ? '' : 'mr-3'} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
            
            {/* CRM Section (Admin only) */}
            {user?.role === 'admin' && (
              <div className="space-y-1">
                <button
                  onClick={handleCRMToggle}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'px-2 justify-center' : 'px-3'} py-2 rounded-lg font-medium transition-all text-left text-sm ${
                    activeView.startsWith('crm-')
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? 'Comercial' : undefined}
                >
                  <TrendingUp size={18} className={sidebarCollapsed ? '' : 'mr-3'} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">Comercial</span>
                      {crmExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </>
                  )}
                </button>
                
                {/* CRM Subitems */}
                {!sidebarCollapsed && crmExpanded && (
                  <div className="ml-6 space-y-1">
                    {crmItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavClick(item.key)}
                          className={`w-full flex items-center px-3 py-2 rounded-lg font-medium transition-all text-left text-sm ${
                            activeView === item.key
                              ? 'bg-blue-100 text-blue-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon size={16} className="mr-3" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
          
          {/* User Info */}
          <div className={`${sidebarCollapsed ? 'px-2' : 'px-4'} py-3 border-t border-gray-200`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-600 truncate">{user?.position}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.unit} • {user?.type}</p>
                </div>
              )}
              <button
                onClick={logout}
                className={`${sidebarCollapsed ? '' : 'ml-2'} p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all`}
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
            {sidebarCollapsed && (
              <div className="mt-2 text-center">
                <div className="w-8 h-8 bg-acasa-purple rounded-full flex items-center justify-center mx-auto">
                  <User className="text-white" size={14} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Top bar for mobile */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-medium text-gray-800">
              ACASA<span className="text-acasa-purple">.Hub</span> • Gestão Integrada
            </h1>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );
};