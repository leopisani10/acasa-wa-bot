import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TalentBankProvider } from './contexts/TalentBankContext';
import { PublicCandidateForm } from './components/talent-bank/PublicCandidateForm';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Public app doesn't need authentication - just the TalentBankProvider for database access
createRoot(rootElement).render(
  <StrictMode>
    <TalentBankProvider>
      <PublicCandidateForm />
    </TalentBankProvider>
  </StrictMode>
);