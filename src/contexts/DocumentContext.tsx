import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { DocumentTemplate, DocumentRevision } from '../types';

interface DocumentContextType {
  documents: DocumentTemplate[];
  addDocument: (document: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, document: Partial<DocumentTemplate>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => DocumentTemplate | undefined;
  addRevision: (documentId: string, revision: Omit<DocumentRevision, 'id'>) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select(`
          *,
          document_revisions(*)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Transform data to match our DocumentTemplate type
      const transformedDocuments: DocumentTemplate[] = data.map(doc => ({
        id: doc.id,
        category: doc.category,
        name: doc.name,
        description: doc.description,
        fileType: doc.file_type,
        attachment: doc.attachment,
        lastRevisionDate: doc.last_revision_date,
        lastRevisionResponsible: doc.last_revision_responsible,
        status: doc.status,
        revisionPeriodicity: doc.revision_periodicity,
        internalNotes: doc.internal_notes || '',
        revisionHistory: doc.document_revisions?.map((revision: any) => ({
          id: revision.id,
          revisionDate: revision.revision_date,
          responsible: revision.responsible,
          changes: revision.changes,
          version: revision.version,
          previousAttachment: revision.previous_attachment,
          newAttachment: revision.new_attachment,
        })) || [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      }));
      
      setDocuments(transformedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (documentData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('document_templates')
        .insert([{
          category: documentData.category,
          name: documentData.name,
          description: documentData.description,
          file_type: documentData.fileType,
          attachment: documentData.attachment,
          last_revision_date: documentData.lastRevisionDate,
          last_revision_responsible: documentData.lastRevisionResponsible,
          status: documentData.status,
          revision_periodicity: documentData.revisionPeriodicity,
          internal_notes: documentData.internalNotes,
          created_by: userId,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  const updateDocument = async (id: string, documentData: Partial<DocumentTemplate>) => {
    try {
      const updateData: any = {};
      
      if (documentData.category !== undefined) updateData.category = documentData.category;
      if (documentData.name !== undefined) updateData.name = documentData.name;
      if (documentData.description !== undefined) updateData.description = documentData.description;
      if (documentData.fileType !== undefined) updateData.file_type = documentData.fileType;
      if (documentData.attachment !== undefined) updateData.attachment = documentData.attachment;
      if (documentData.lastRevisionDate !== undefined) updateData.last_revision_date = documentData.lastRevisionDate;
      if (documentData.lastRevisionResponsible !== undefined) updateData.last_revision_responsible = documentData.lastRevisionResponsible;
      if (documentData.status !== undefined) updateData.status = documentData.status;
      if (documentData.revisionPeriodicity !== undefined) updateData.revision_periodicity = documentData.revisionPeriodicity;
      if (documentData.internalNotes !== undefined) updateData.internal_notes = documentData.internalNotes;
      
      const { error } = await supabase
        .from('document_templates')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getDocument = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const addRevision = async (documentId: string, revisionData: Omit<DocumentRevision, 'id'>) => {
    try {
      const { error } = await supabase
        .from('document_revisions')
        .insert([{
          document_id: documentId,
          revision_date: revisionData.revisionDate,
          responsible: revisionData.responsible,
          changes: revisionData.changes,
          version: revisionData.version,
          previous_attachment: revisionData.previousAttachment,
          new_attachment: revisionData.newAttachment,
        }]);
      
      if (error) throw error;
      
      // Update the document with new revision info
      await supabase
        .from('document_templates')
        .update({
          last_revision_date: revisionData.revisionDate,
          last_revision_responsible: revisionData.responsible,
        })
        .eq('id', documentId);
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error adding revision:', error);
    }
  };

  const value = {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    addRevision,
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
};