import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { WeeklyMenu, DailyMenu, FoodItem } from '../types';

interface CardapioContextType {
  weeklyMenus: WeeklyMenu[];
  foodItems: FoodItem[];
  addWeeklyMenu: (menu: Omit<WeeklyMenu, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateWeeklyMenu: (id: string, menu: Partial<WeeklyMenu>) => void;
  deleteWeeklyMenu: (id: string) => void;
  getWeeklyMenu: (id: string) => WeeklyMenu | undefined;
  getMenusByWeek: (weekStartDate: string, unit: string) => WeeklyMenu[];
  duplicateMenu: (sourceMenuId: string, targetWeek: string, targetUnit?: string) => void;
  addFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
  getFoodSuggestions: (mealType: string, query: string) => FoodItem[];
  getWeekDates: (date: string) => { start: string; end: string; weekNumber: number };
}

const CardapioContext = createContext<CardapioContextType | undefined>(undefined);

export const useCardapio = () => {
  const context = useContext(CardapioContext);
  if (context === undefined) {
    throw new Error('useCardapio must be used within a CardapioProvider');
  }
  return context;
};

interface CardapioProviderProps {
  children: ReactNode;
}

export const CardapioProvider: React.FC<CardapioProviderProps> = ({ children }) => {
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    // Carregar dados salvos
    const savedMenus = localStorage.getItem('acasa_weekly_menus');
    if (savedMenus) {
      setWeeklyMenus(JSON.parse(savedMenus));
    } else {
      // Adicionar cardápio de exemplo se não há dados salvos
      const exampleMenu: WeeklyMenu = {
        id: '1',
        unit: 'Botafogo',
        dietType: 'Dieta Branda',
        weekStartDate: '2025-08-06',
        weekEndDate: '2025-08-12',
        weekNumber: 32,
        year: 2025,
        wednesday: {
          breakfastCoffee: 'Pão de forma com margarina + Achocolatado',
          morningSnack: 'Vitamina de banana',
          lunch: 'Frango em iscas acebolado + Arroz branco + Lentilha + Salada de repolho e pepino',
          dailyJuice: 'Suco de pitanga',
          dessert: 'Gelatina de morango',
          afternoonSnack: 'Pizza de mussarela com tomate e orégano',
          dinner: 'Strogonoff de frango + Arroz branco + Batata palha + Cenoura e beterraba ralada',
          eveningJuice: 'Suco de caju',
          lateNightSnack: 'Café com leite',
        },
        thursday: {
          breakfastCoffee: 'Pão de forma com requeijão + Café com leite',
          morningSnack: 'Suco de maracujá',
          lunch: 'Kibe de forno + Arroz branco com cenoura + Feijão carioca + Couve refogada',
          dailyJuice: 'Suco de caju',
          dessert: 'Abacaxi em cubos',
          afternoonSnack: 'Pão de forma com margarina + Café com leite',
          dinner: 'Sopa de legumes (cenoura, batata e tomate) + Frango desfiado',
          eveningJuice: 'Água',
          lateNightSnack: 'Mingau de maizena',
        },
        friday: {
          breakfastCoffee: 'Pão de milho com margarina + Café com leite',
          morningSnack: 'Vitamina de abacate com aveia',
          lunch: 'Frango desfiado ao molho de tomate + Arroz branco + Feijão preto + Purê de abóbora',
          dailyJuice: 'Suco de abacaxi',
          dessert: 'Gelatina de limão',
          afternoonSnack: 'Bisnaguinha com requeijão + Café com leite',
          dinner: 'Carne assada + Arroz branco + Feijão preto + Abobrinha refogada',
          eveningJuice: 'Suco de laranja',
          lateNightSnack: 'Biscoito cream cracker + Café com leite',
        },
        saturday: {
          breakfastCoffee: 'Pão de forma com requeijão + Café com leite',
          morningSnack: 'Banana em rodelas com canela',
          lunch: 'Carne moída + Arroz branco + Feijão carioca + Farofa com cebola + Cenoura e beterraba raladas',
          dailyJuice: 'Suco de caju',
          dessert: 'Creme de goiabada',
          afternoonSnack: 'Sanduíche com pasta de sardinha + Refresco',
          dinner: 'Caldo verde + Torradinhas',
          eveningJuice: 'Água',
          lateNightSnack: 'Mingau de mucilon',
        },
        sunday: {
          breakfastCoffee: 'Pão de forma com margarina + Café com leite',
          morningSnack: 'Vitamina de maçã com aveia',
          lunch: 'Escondidinho de frango com batata inglesa + Arroz branco + Feijão preto + Salada de alface e tomate',
          dailyJuice: 'Suco de uva',
          dessert: 'Banana com canela',
          afternoonSnack: 'Bolo mesclado + Café',
          dinner: 'Omelete de forno com espinafre + Arroz branco + Feijão preto + Abóbora cozida',
          eveningJuice: 'Suco de caju',
          lateNightSnack: 'Mingau de maizena',
        },
        monday: {
          breakfastCoffee: 'Bisnaguinha com requeijão + Achocolatado',
          morningSnack: 'Suco de caju',
          lunch: 'Omelete de legumes (cenoura e abobrinha) + Arroz branco + Feijão preto + Purê de batata',
          dailyJuice: 'Suco de laranja',
          dessert: 'Gelatina de framboesa',
          afternoonSnack: 'Pão de forma com requeijão + Café com leite',
          dinner: 'Frango desfiado + Arroz branco + Feijão preto + Chuchu cozido + Tomate picado',
          eveningJuice: 'Água',
          lateNightSnack: 'Biscoito cream cracker + Leite quente',
        },
        tuesday: {
          breakfastCoffee: 'Pão de forma com margarina e ricota + Café com leite',
          morningSnack: 'Suco de laranja',
          lunch: 'Carne moída + Arroz branco + Feijão carioca + Brócolis cozido',
          dailyJuice: 'Suco de caju',
          dessert: 'Mamão em cubos',
          afternoonSnack: 'Biscoito de polvilho + Café com leite',
          dinner: 'Sobrecoxa + Arroz branco + Feijão preto + Salada de repolho com cenoura',
          eveningJuice: 'Suco de laranja',
          lateNightSnack: 'Mingau de mucilon',
        },
        observations: 'Todos os caldos e sopas devem ser associados à proteína. Alimentos bem cozidos e temperados.',
        dietNotes: 'Todos os caldos e sopas devem ser associados à proteína. Alimentos bem cozidos e temperados.',
        status: 'Publicado',
        createdBy: 'sistema',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedMenus = [exampleMenu];
      saveMenus(updatedMenus);
    }

    const savedFoodItems = localStorage.getItem('acasa_food_items');
    if (savedFoodItems) {
      setFoodItems(JSON.parse(savedFoodItems));
    } else {
      // Criar itens de comida padrão
      const defaultFoodItems: FoodItem[] = [
        // Café da manhã
        { id: '1', name: 'Pão francês com margarina', category: 'Carboidrato', mealType: 'Café da manhã', isPopular: true, createdAt: new Date().toISOString() },
        { id: '2', name: 'Café com leite', category: 'Bebida', mealType: 'Café da manhã', isPopular: true, createdAt: new Date().toISOString() },
        { id: '3', name: 'Tapioca com queijo', category: 'Carboidrato', mealType: 'Café da manhã', isPopular: true, createdAt: new Date().toISOString() },
        
        // Almoço
        { id: '4', name: 'Arroz branco', category: 'Carboidrato', mealType: 'Almoço', isPopular: true, createdAt: new Date().toISOString() },
        { id: '5', name: 'Feijão carioca', category: 'Proteína', mealType: 'Almoço', isPopular: true, createdAt: new Date().toISOString() },
        { id: '6', name: 'Frango grelhado', category: 'Proteína', mealType: 'Almoço', isPopular: true, createdAt: new Date().toISOString() },
        { id: '7', name: 'Abobrinha refogada', category: 'Verdura', mealType: 'Almoço', isPopular: true, createdAt: new Date().toISOString() },
        { id: '8', name: 'Salada de alface e tomate', category: 'Verdura', mealType: 'Almoço', isPopular: true, createdAt: new Date().toISOString() },
        
        // Sucos
        { id: '9', name: 'Suco de laranja', category: 'Bebida', mealType: 'Suco', isPopular: true, createdAt: new Date().toISOString() },
        { id: '10', name: 'Suco de maracujá', category: 'Bebida', mealType: 'Suco', isPopular: true, createdAt: new Date().toISOString() },
        { id: '11', name: 'Água de coco', category: 'Bebida', mealType: 'Suco', isPopular: true, createdAt: new Date().toISOString() },
        
        // Sobremesas
        { id: '12', name: 'Gelatina diet', category: 'Sobremesa', mealType: 'Sobremesa', isPopular: true, createdAt: new Date().toISOString() },
        { id: '13', name: 'Pudim de leite', category: 'Sobremesa', mealType: 'Sobremesa', isPopular: true, createdAt: new Date().toISOString() },
        { id: '14', name: 'Fruta da época', category: 'Fruta', mealType: 'Sobremesa', isPopular: true, createdAt: new Date().toISOString() },
      ];
      
      setFoodItems(defaultFoodItems);
      localStorage.setItem('acasa_food_items', JSON.stringify(defaultFoodItems));
    }
  };

  const saveMenus = (menus: WeeklyMenu[]) => {
    setWeeklyMenus(menus);
    localStorage.setItem('acasa_weekly_menus', JSON.stringify(menus));
  };

  const saveFoodItems = (items: FoodItem[]) => {
    setFoodItems(items);
    localStorage.setItem('acasa_food_items', JSON.stringify(items));
  };

  const getWeekDates = (date: string) => {
    // Usar EXATAMENTE a data escolhida como primeiro dia
    const startDate = new Date(date + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Calcular CORRETAMENTE a semana do ano
    const firstDayOfYear = new Date(startDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (startDate.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      weekNumber,
    };
  };

  const addWeeklyMenu = (menuData: Omit<WeeklyMenu, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newMenu: WeeklyMenu = {
      ...menuData,
      id: Date.now().toString(),
      createdBy: 'current-user', // TODO: pegar do contexto de auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedMenus = [...weeklyMenus, newMenu];
    saveMenus(updatedMenus);
  };

  const updateWeeklyMenu = (id: string, menuData: Partial<WeeklyMenu>) => {
    const updatedMenus = weeklyMenus.map(menu =>
      menu.id === id
        ? { ...menu, ...menuData, updatedAt: new Date().toISOString() }
        : menu
    );
    saveMenus(updatedMenus);
  };

  const deleteWeeklyMenu = (id: string) => {
    const updatedMenus = weeklyMenus.filter(menu => menu.id !== id);
    saveMenus(updatedMenus);
  };

  const getWeeklyMenu = (id: string) => {
    return weeklyMenus.find(menu => menu.id === id);
  };

  const getMenusByWeek = (weekStartDate: string, unit: string) => {
    return weeklyMenus.filter(menu => 
      menu.weekStartDate === weekStartDate && menu.unit === unit
    );
  };

  const duplicateMenu = (sourceMenuId: string, targetWeek: string, targetUnit?: string) => {
    const sourceMenu = weeklyMenus.find(menu => menu.id === sourceMenuId);
    if (!sourceMenu) return;

    const weekDates = getWeekDates(targetWeek);
    
    const duplicatedMenu: Omit<WeeklyMenu, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      ...sourceMenu,
      unit: targetUnit || sourceMenu.unit,
      weekStartDate: weekDates.start,
      weekEndDate: weekDates.end,
      weekNumber: weekDates.weekNumber,
      year: new Date(weekDates.start).getFullYear(),
    };

    addWeeklyMenu(duplicatedMenu);
  };

  const addFoodItem = (itemData: Omit<FoodItem, 'id' | 'createdAt'>) => {
    const newItem: FoodItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...foodItems, newItem];
    saveFoodItems(updatedItems);
  };

  const getFoodSuggestions = (mealType: string, query: string): FoodItem[] => {
    if (!query || query.length < 2) return [];

    return foodItems
      .filter(item => 
        (item.mealType === mealType || item.mealType === 'Qualquer') &&
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        // Priorizar itens populares
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  };

  const value = {
    weeklyMenus,
    foodItems,
    addWeeklyMenu,
    updateWeeklyMenu,
    deleteWeeklyMenu,
    getWeeklyMenu,
    getMenusByWeek,
    duplicateMenu,
    addFoodItem,
    getFoodSuggestions,
    getWeekDates,
  };

  return <CardapioContext.Provider value={value}>{children}</CardapioContext.Provider>;
};