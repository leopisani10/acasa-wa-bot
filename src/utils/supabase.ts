import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'EXISTS' : 'MISSING');
  
  // Show user-friendly error in the browser
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
        <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">⚠️ Erro de Configuração</h1>
        <p style="color: #374151; margin-bottom: 1rem;">As variáveis de ambiente do Supabase não estão configuradas.</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Clique no botão "Connect to Supabase" no canto superior direito para configurar a conexão com o banco de dados.
        </p>
      </div>
    </div>
  `;
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Erro: URL do Supabase inválida:', supabaseUrl);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
        <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">⚠️ URL do Supabase Inválida</h1>
        <p style="color: #374151; margin-bottom: 1rem;">A URL do Supabase está mal formatada.</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Clique no botão "Connect to Supabase" no canto superior direito para reconfigurar a conexão.
        </p>
      </div>
    </div>
  `;
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Test connection on initialization
supabase.auth.getSession().catch(error => {
  console.error('❌ Erro de conexão com Supabase:', error);
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
        <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
          <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">🔌 Erro de Conexão</h1>
          <p style="color: #374151; margin-bottom: 1rem;">Não foi possível conectar ao banco de dados Supabase.</p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
            Clique no botão "Connect to Supabase" no canto superior direito para configurar a conexão com o banco de dados.
          </p>
          <div style="background: #f3f4f6; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; text-align: left;">
            <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;"><strong>Possíveis causas:</strong></p>
            <ul style="font-size: 0.875rem; color: #6b7280; margin-left: 1rem;">
              <li>• Variáveis de ambiente do Supabase não configuradas</li>
              <li>• URL do Supabase inválida ou incorreta</li>
              <li>• Problemas de conectividade de rede</li>
              <li>• Projeto Supabase pausado ou inacessível</li>
            </ul>
          </div>
          <button onclick="window.location.reload()" style="background: #8B2C8A; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
            Tentar Novamente
          </button>
        </div>
      </div>
    `;
  } else if (error.message.includes('Invalid API key')) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
        <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
          <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">🔑 Erro de Autenticação</h1>
          <p style="color: #374151; margin-bottom: 1rem;">Chave de API do Supabase inválida.</p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
            Clique no botão "Connect to Supabase" no canto superior direito para reconfigurar a conexão.
          </p>
          <button onclick="window.location.reload()" style="background: #8B2C8A; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
            Tentar Novamente
          </button>
        </div>
      </div>
    `;
  }
});

// Enhanced error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  }
});

// Helper function to get current user ID
export const getCurrentUserId = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user?.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};