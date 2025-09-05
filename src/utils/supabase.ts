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

// Test connection on initialization with improved error handling
const testConnection = async () => {
  try {
    await supabase.auth.getSession();
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Erro de conexão com Supabase:', error);
    
    // Check for network/connection errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
            <h1 style="color: #dc2626; font-size: 1.875rem; margin-bottom: 1.5rem;">🔌 Erro de Conexão com Supabase</h1>
            <p style="color: #374151; margin-bottom: 1.5rem; font-size: 1.125rem;">Não foi possível conectar ao Supabase. Este é o erro mais comum!</p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; text-align: left;">
              <p style="font-size: 1rem; color: #92400e; margin-bottom: 0.75rem;"><strong>🚨 Principais causas (90% dos casos):</strong></p>
              <ul style="font-size: 0.875rem; color: #92400e; margin-left: 1rem; space-y: 0.25rem;">
                <li><strong>• Variáveis não configuradas:</strong> VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes</li>
                <li><strong>• URL incorreta:</strong> URL do Supabase inválida no .env</li>
                <li><strong>• Projeto pausado:</strong> Projeto Supabase inativo/pausado</li>
                <li><strong>• Chave errada:</strong> ANON_KEY incorreta ou expirada</li>
                <li><strong>• Projeto deletado:</strong> Projeto foi removido do Supabase</li>
              </ul>
            </div>
            
            <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 0.5rem; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
              <p style="font-size: 1.125rem; color: #15803d; margin-bottom: 1rem;"><strong>✅ SOLUÇÃO RÁPIDA:</strong></p>
              <ol style="font-size: 0.875rem; color: #1e40af; margin-left: 1rem; space-y: 0.25rem;">
                <li><strong>1. CLIQUE no botão "Connect to Supabase" (canto superior direito)</strong></li>
                <li>2. Ou configure manualmente o arquivo .env na raiz do projeto</li>
                <li>3. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretos</li>
                <li>4. Confirme que o projeto está ativo no dashboard Supabase</li>
                <li>5. Reinicie o servidor após configurar (Ctrl+C e npm run dev)</li>
              </ol>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
              <button onclick="window.location.reload()" style="background: #22c55e; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem;">
                🔄 Tentar Novamente
              </button>
              <button onclick="window.open('https://app.supabase.com/', '_blank')" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem;">
                🔗 Abrir Supabase
              </button>
            </div>
            
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 1rem; font-style: italic;">
              💡 Dica: O botão "Connect to Supabase" resolve 90% dos problemas automaticamente!
            </p>
          </div>
        </div>
      `;
    } else if (error.message && error.message.includes('NetworkError')) {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
            <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">📡 Erro de Rede</h1>
            <p style="color: #374151; margin-bottom: 1rem;">Problema de conectividade de rede detectado.</p>
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
              Verifique sua conexão com a internet e tente novamente.
            </p>
            <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
              Recarregar Página
            </button>
          </div>
        </div>
      `;
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
            <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">📡 Erro de Rede</h1>
            <p style="color: #374151; margin-bottom: 1rem;">Problema de conectividade de rede detectado.</p>
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">
              Verifique sua conexão com a internet e tente novamente.
            </p>
            <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
              Recarregar Página
            </button>
          </div>
        </div>
      `;
    } else if (error.message.includes('Invalid API key')) {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
            <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">🔑 Erro de Autenticação</h1>
            <p style="color: #374151; margin-bottom: 1rem;">Chave de API do Supabase inválida ou expirada.</p>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; text-align: left;">
              <p style="font-size: 0.875rem; color: #92400e; margin-bottom: 0.5rem;"><strong>Solução:</strong></p>
              <ul style="font-size: 0.875rem; color: #92400e; margin-left: 1rem;">
                <li>• Verifique a chave VITE_SUPABASE_ANON_KEY no arquivo .env</li>
                <li>• Acesse o dashboard do Supabase e copie a chave correta</li>
                <li>• Reinicie o servidor de desenvolvimento após alterar o .env</li>
              </ul>
            </div>
            <button onclick="window.location.reload()" style="background: #f59e0b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
              Tentar Novamente
            </button>
          </div>
        </div>
      `;
    } else {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: center;">
            <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">🔌 Erro de Conexão</h1>
            <p style="color: #374151; margin-bottom: 1rem;">Erro inesperado na conexão com Supabase.</p>
            <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; text-align: left;">
              <p style="font-size: 0.875rem; color: #991b1b;"><strong>Erro técnico:</strong> ${error.message}</p>
            </div>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; text-align: left;">
              <p style="font-size: 0.875rem; color: #92400e; margin-bottom: 0.5rem;"><strong>Possíveis causas:</strong></p>
              <ul style="font-size: 0.875rem; color: #92400e; margin-left: 1rem;">
                <li>• Configuração incorreta do Supabase</li>
                <li>• Problemas de conectividade de rede</li>
                <li>• Projeto Supabase pausado ou inacessível</li>
              </ul>
            </div>
            <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500; margin-top: 1rem;">
              Tentar Novamente
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Call test connection
testConnection();

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