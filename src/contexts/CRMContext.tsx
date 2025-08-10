import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { Lead, Contact, Activity, Unit, LeadFilters, LeadStage } from '../types/crm';

interface CRMContextType {
  // Leads
  leads: Lead[];
  addLead: (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>, contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, leadData: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  getLead: (id: string) => Lead | undefined;
  updateLeadStage: (id: string, stage: LeadStage) => Promise<void>;
  
  // Contacts
  contacts: Contact[];
  findContactByPhone: (phone: string) => Contact | undefined;
  updateContact: (id: string, contactData: Partial<Contact>) => Promise<void>;
  
  // Activities
  activities: Activity[];
  addActivity: (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateActivity: (id: string, activityData: Partial<Activity>) => Promise<void>;
  toggleActivity: (id: string) => Promise<void>;
  getLeadActivities: (leadId: string) => Activity[];
  
  // Units
  units: Unit[];
  
  // Filters and search
  filteredLeads: Lead[];
  setFilters: (filters: LeadFilters) => void;
  filters: LeadFilters;
  
  // State
  loading: boolean;
  error: string | null;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

interface CRMProviderProps {
  children: ReactNode;
}

export const CRMProvider: React.FC<CRMProviderProps> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      await Promise.all([
        fetchUnits(),
        fetchContacts(),
        fetchLeads(),
        fetchActivities(),
      ]);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      setError('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setUnits(data || []);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        unit:units(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setContacts(data || []);
  };

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        contact:contacts(*),
        owner:profiles!leads_owner_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setLeads(data || []);
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Fetch creator information separately since foreign key might not exist
    const activitiesWithCreator = await Promise.all(
      (data || []).map(async (activity) => {
        if (activity.created_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', activity.created_by)
            .single();
          
          return {
            ...activity,
            creator: profile
          };
        }
        return activity;
      })
    );
    
    setActivities(activitiesWithCreator);
  };

  const addLead = async (
    leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>, 
    contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const userId = await getCurrentUserId();
      
      // Check if contact already exists by phone
      let contactId = leadData.contact_id;
      
      if (!contactId && contactData.phone) {
        const existingContact = findContactByPhone(contactData.phone);
        
        if (existingContact) {
          contactId = existingContact.id;
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert([{
              ...contactData,
              created_by: userId,
            }])
            .select()
            .single();
          
          if (contactError) throw contactError;
          contactId = newContact.id;
        }
      }

      // Create lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          contact_id: contactId,
          created_by: userId,
        }])
        .select()
        .single();
      
      if (leadError) throw leadError;
      
      await fetchContacts();
      await fetchLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id);
      
      if (error) throw error;
      await fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  };

  const updateLeadStage = async (id: string, stage: LeadStage) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage })
        .eq('id', id);
      
      if (error) throw error;
      await fetchLeads();
    } catch (error) {
      console.error('Error updating lead stage:', error);
      throw error;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  };

  const getLead = (id: string) => {
    return leads.find(lead => lead.id === id);
  };

  const findContactByPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return contacts.find(contact => 
      contact.phone && contact.phone.replace(/\D/g, '') === cleanPhone
    );
  };

  const updateContact = async (id: string, contactData: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', id);
      
      if (error) throw error;
      await fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const addActivity = async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const userId = await getCurrentUserId();
      
      const { error } = await supabase
        .from('activities')
        .insert([{
          ...activityData,
          created_by: userId,
        }]);
      
      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  };

  const updateActivity = async (id: string, activityData: Partial<Activity>) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', id);
      
      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  const toggleActivity = async (id: string) => {
    try {
      const activity = activities.find(a => a.id === id);
      if (!activity) return;

      const { error } = await supabase
        .from('activities')
        .update({ done: !activity.done })
        .eq('id', id);
      
      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error toggling activity:', error);
      throw error;
    }
  };

  const getLeadActivities = (leadId: string) => {
    return activities
      .filter(activity => activity.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Apply filters to leads
  const filteredLeads = leads.filter(lead => {
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.unit_id && lead.contact?.unit_id !== filters.unit_id) return false;
    if (filters.owner_id && lead.owner_id !== filters.owner_id) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesContact = lead.contact?.full_name?.toLowerCase().includes(search) ||
                           lead.contact?.phone?.includes(search);
      const matchesLead = lead.elderly_name?.toLowerCase().includes(search) ||
                         lead.diagnosis?.toLowerCase().includes(search);
      if (!matchesContact && !matchesLead) return false;
    }
    if (filters.created_from) {
      const createdDate = new Date(lead.created_at).toISOString().split('T')[0];
      if (createdDate < filters.created_from) return false;
    }
    if (filters.created_to) {
      const createdDate = new Date(lead.created_at).toISOString().split('T')[0];
      if (createdDate > filters.created_to) return false;
    }
    return true;
  });

  const value = {
    leads,
    addLead,
    updateLead,
    deleteLead,
    getLead,
    updateLeadStage,
    contacts,
    findContactByPhone,
    updateContact,
    activities,
    addActivity,
    updateActivity,
    toggleActivity,
    getLeadActivities,
    units,
    filteredLeads,
    setFilters,
    filters,
    loading,
    error,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};