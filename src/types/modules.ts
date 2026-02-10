export interface SystemModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'clinical' | 'administrative' | 'support';
  dependencies: string[]; // IDs of modules this module depends on
  requiredBy: string[]; // IDs of modules that depend on this module
  minRole: 'staff' | 'admin'; // Minimum role required to access
  isRequired: boolean; // If true, cannot be disabled
}

export interface UserPermissions {
  userId: string;
  enabledModules: string[];
  customPermissions?: Record<string, boolean>;
  restrictedActions?: string[];
}

export interface ModuleDependencyCheck {
  isValid: boolean;
  missingDependencies: string[];
  affectedModules: string[];
  warnings: string[];
}

export const SYSTEM_MODULES: Record<string, SystemModule> = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Visão geral do sistema e estatísticas principais',
    icon: 'Home',
    category: 'core',
    dependencies: [],
    requiredBy: [],
    minRole: 'staff',
    isRequired: true,
  },
  profile: {
    id: 'profile',
    name: 'Meu Perfil',
    description: 'Configurações pessoais do usuário',
    icon: 'Settings',
    category: 'core',
    dependencies: [],
    requiredBy: [],
    minRole: 'staff',
    isRequired: true,
  },
  guests: {
    id: 'guests',
    name: 'Hóspedes',
    description: 'Cadastro e gestão de residentes',
    icon: 'User',
    category: 'core',
    dependencies: [],
    requiredBy: ['prontuario', 'katz', 'agravos'],
    minRole: 'admin',
    isRequired: false,
  },
  employees: {
    id: 'employees',
    name: 'Colaboradores',
    description: 'Gestão de funcionários e equipe',
    icon: 'Users',
    category: 'administrative',
    dependencies: [],
    requiredBy: ['schedules', 'sobreaviso', 'nfrda'],
    minRole: 'admin',
    isRequired: false,
  },
  prontuario: {
    id: 'prontuario',
    name: 'Prontuário Eletrônico',
    description: 'Sistema de evoluções multidisciplinares',
    icon: 'FileText',
    category: 'clinical',
    dependencies: ['guests'],
    requiredBy: [],
    minRole: 'staff',
    isRequired: false,
  },
  schedules: {
    id: 'schedules',
    name: 'Escalas',
    description: 'Gestão de escalas de trabalho',
    icon: 'Calendar',
    category: 'administrative',
    dependencies: ['employees'],
    requiredBy: [],
    minRole: 'staff',
    isRequired: false,
  },
  sobreaviso: {
    id: 'sobreaviso',
    name: 'Sobreaviso',
    description: 'Colaboradores para substituições',
    icon: 'Clock',
    category: 'administrative',
    dependencies: ['employees'],
    requiredBy: ['schedules'],
    minRole: 'staff',
    isRequired: false,
  },
  cardapio: {
    id: 'cardapio',
    name: 'Cardápio',
    description: 'Planejamento de cardápios semanais',
    icon: 'ChefHat',
    category: 'support',
    dependencies: [],
    requiredBy: [],
    minRole: 'staff',
    isRequired: false,
  },
  documents: {
    id: 'documents',
    name: 'Modelos',
    description: 'Modelos de documentos e templates',
    icon: 'FileText',
    category: 'administrative',
    dependencies: [],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  katz: {
    id: 'katz',
    name: 'Escala de Katz',
    description: 'Avaliação funcional dos residentes',
    icon: 'Clipboard',
    category: 'clinical',
    dependencies: ['guests'],
    requiredBy: [],
    minRole: 'staff',
    isRequired: false,
  },
  agravos: {
    id: 'agravos',
    name: 'Agravos',
    description: 'Controle de intercorrências e eventos adversos',
    icon: 'AlertTriangle',
    category: 'clinical',
    dependencies: ['guests'],
    requiredBy: [],
    minRole: 'staff',
    isRequired: false,
  },
  certificates: {
    id: 'certificates',
    name: 'Certificados',
    description: 'Gestão de certificados obrigatórios',
    icon: 'FileCheck',
    category: 'administrative',
    dependencies: [],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  nfrda: {
    id: 'nfrda',
    name: 'NF + RDA',
    description: 'Controle de notas fiscais e relatórios',
    icon: 'Receipt',
    category: 'administrative',
    dependencies: ['employees'],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  users: {
    id: 'users',
    name: 'Usuários',
    description: 'Gestão de usuários e permissões',
    icon: 'UserCog',
    category: 'administrative',
    dependencies: [],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  'crm-leads': {
    id: 'crm-leads',
    name: 'CRM - Leads',
    description: 'Gestão de leads comerciais e contatos',
    icon: 'UserPlus',
    category: 'administrative',
    dependencies: [],
    requiredBy: ['crm-pipeline', 'crm-reports'],
    minRole: 'admin',
    isRequired: false,
  },
  'crm-pipeline': {
    id: 'crm-pipeline',
    name: 'CRM - Pipeline',
    description: 'Funil de vendas e acompanhamento',
    icon: 'Kanban',
    category: 'administrative',
    dependencies: ['crm-leads'],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  'crm-inbox': {
    id: 'crm-inbox',
    name: 'CRM - Inbox',
    description: 'Central de mensagens e comunicação',
    icon: 'MessageCircle',
    category: 'administrative',
    dependencies: ['crm-leads'],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  'crm-reports': {
    id: 'crm-reports',
    name: 'CRM - Relatórios',
    description: 'Análises e métricas de vendas',
    icon: 'BarChart3',
    category: 'administrative',
    dependencies: ['crm-leads'],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
  financial: {
    id: 'financial',
    name: 'Financeiro',
    description: 'Gestão financeira e receitas dos hóspedes',
    icon: 'DollarSign',
    category: 'administrative',
    dependencies: ['guests'],
    requiredBy: [],
    minRole: 'admin',
    isRequired: false,
  },
};

// Helper functions for dependency management
export const getModuleDependencies = (moduleId: string): string[] => {
  const module = SYSTEM_MODULES[moduleId];
  if (!module) return [];
  
  const allDependencies = new Set<string>();
  
  const addDependencies = (id: string) => {
    const mod = SYSTEM_MODULES[id];
    if (!mod) return;
    
    mod.dependencies.forEach(depId => {
      if (!allDependencies.has(depId)) {
        allDependencies.add(depId);
        addDependencies(depId); // Recursive for nested dependencies
      }
    });
  };
  
  addDependencies(moduleId);
  return Array.from(allDependencies);
};

export const validateModuleSelection = (selectedModules: string[]): ModuleDependencyCheck => {
  const missingDependencies: string[] = [];
  const warnings: string[] = [];
  const affectedModules: string[] = [];
  
  selectedModules.forEach(moduleId => {
    const dependencies = getModuleDependencies(moduleId);
    dependencies.forEach(depId => {
      if (!selectedModules.includes(depId)) {
        missingDependencies.push(depId);
        warnings.push(`${SYSTEM_MODULES[moduleId]?.name} requer ${SYSTEM_MODULES[depId]?.name}`);
      }
    });
  });
  
  // Check for modules that would be affected by disabling others
  Object.values(SYSTEM_MODULES).forEach(module => {
    if (selectedModules.includes(module.id)) return;
    
    const dependentModules = module.requiredBy.filter(reqId => selectedModules.includes(reqId));
    if (dependentModules.length > 0) {
      affectedModules.push(module.id);
      dependentModules.forEach(reqId => {
        warnings.push(`${SYSTEM_MODULES[reqId]?.name} não funcionará sem ${module.name}`);
      });
    }
  });
  
  return {
    isValid: missingDependencies.length === 0,
    missingDependencies: [...new Set(missingDependencies)],
    affectedModules: [...new Set(affectedModules)],
    warnings: [...new Set(warnings)],
  };
};

export const getRequiredModulesForUser = (role: 'staff' | 'admin'): string[] => {
  return Object.values(SYSTEM_MODULES)
    .filter(module => module.isRequired || (module.minRole === 'staff' && role === 'admin'))
    .map(module => module.id);
};

export const autoFixModuleSelection = (selectedModules: string[]): string[] => {
  const fixed = new Set(selectedModules);
  
  // Add required dependencies
  selectedModules.forEach(moduleId => {
    const dependencies = getModuleDependencies(moduleId);
    dependencies.forEach(depId => fixed.add(depId));
  });
  
  // Add required modules
  Object.values(SYSTEM_MODULES).forEach(module => {
    if (module.isRequired) {
      fixed.add(module.id);
    }
  });
  
  return Array.from(fixed);
};