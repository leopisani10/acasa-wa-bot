import React, { useState, useEffect } from 'react';
import { MessageCircle, Smartphone, Zap, Users, BarChart3, Clock, Eye, EyeOff, Save, Send, Wifi, WifiOff, QrCode, Settings, Shield, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBotConfig } from '../../hooks/useBotConfig';
import { getStatus, getQr, sendMessage } from '../../services/botClient';

export const CRMInbox: React.FC = () => {
  const { user } = useAuth();
  const { config, saveConfig, isConfigured } = useBotConfig();
  
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [lastQrGenerated, setLastQrGenerated] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Check if user has permission (admin only)
  const hasPermission = user?.role === 'admin';

  useEffect(() => {
    if (isConfigured) {
      setBaseUrl(config.baseUrl);
      setToken(config.token);
      checkBotStatus();
    }
  }, [isConfigured, config]);

  // Auto-refresh status when online
  useEffect(() => {
    if (botStatus?.ready && isConfigured) {
      const statusInterval = setInterval(() => {
        checkBotStatus();
      }, 3000); // Check every 3 seconds when online for reliability
      
      return () => clearInterval(statusInterval);
    }
  }, [botStatus?.ready, isConfigured]);

  // QR polling when offline
  useEffect(() => {
    if (isConfigured && botStatus?.ready === false) {
      const qrInterval = setInterval(() => {
        fetchQrCode();
      }, 5000); // Poll QR every 5 seconds when offline
      
      return () => clearInterval(qrInterval);
    } else {
      setQrDataUrl(null);
      setLastQrGenerated(0);
    }
  }, [botStatus?.ready, isConfigured]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const checkBotStatus = async () => {
    if (!baseUrl || !token) return;

    try {
      setLoading(true);
      const status = await getStatus(baseUrl, token);
      setBotStatus(status);
      setLastStatusCheck(new Date());
      
      if (status.ready && qrDataUrl) {
        // Clear QR when ready
        setQrDataUrl(null);
        setLastQrGenerated(0);
        showToast('success', 'WhatsApp conectado com sucesso!');
      }
    } catch (error) {
      console.error('Error checking bot status:', error);
      setBotStatus(null);
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          showToast('error', 'Token inválido (HUB_TOKEN)');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          showToast('error', 'Bot indisponível. Verifique URL e CORS.');
        } else {
          showToast('error', 'Erro de conexão com o bot');
        }
      } else {
        showToast('error', 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async () => {
    if (!baseUrl || !token || botStatus?.ready) return;

    try {
      setQrLoading(true);
      const qrResponse = await getQr(baseUrl, token);
      
      // Only update QR if it's new (based on generatedAt timestamp)
      if (qrResponse.dataUrl && qrResponse.generatedAt && qrResponse.generatedAt > lastQrGenerated) {
        setQrDataUrl(qrResponse.dataUrl);
        setLastQrGenerated(qrResponse.generatedAt);
        console.log('📱 QR updated:', new Date(qrResponse.generatedAt).toLocaleTimeString('pt-BR'));
      } else if (qrResponse.message === 'already_ready') {
        // Bot became ready, refresh status
        checkBotStatus();
      } else if (qrResponse.message === 'qr_not_ready') {
        // QR not ready yet, continue polling
        console.log('⏳ QR not ready yet...');
      }
    } catch (error) {
      console.error('Error fetching QR:', error);
      // Don't show toast for QR errors to avoid spam
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveConfig = () => {
    if (!baseUrl.trim() || !token.trim()) {
      showToast('error', 'URL e Token são obrigatórios');
      return;
    }

    try {
      new URL(baseUrl); // Validate URL format
    } catch {
      showToast('error', 'URL inválida. Use formato: https://seu-bot.onrender.com');
      return;
    }

    const newConfig = {
      baseUrl: baseUrl.trim().replace(/\/$/, ''), // Remove trailing slash
      token: token.trim(),
    };

    saveConfig(newConfig);
    showToast('success', 'Configuração salva com sucesso!');
    
    // Check status immediately after saving
    setTimeout(() => {
      checkBotStatus();
    }, 500);
  };

  const handleTestSend = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      showToast('error', 'Telefone e mensagem são obrigatórios');
      return;
    }

    try {
      setTestLoading(true);
      await sendMessage(config.baseUrl, config.token, testPhone, testMessage);
      showToast('success', 'Mensagem enviada com sucesso!');
      setShowTestModal(false);
      setTestPhone('');
      setTestMessage('');
    } catch (error) {
      console.error('Error sending test message:', error);
      showToast('error', 'Erro ao enviar mensagem. Verifique o número e tente novamente.');
    } finally {
      setTestLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-full">
              <Shield className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600">Apenas administradores podem acessar a integração WhatsApp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-full">
            <MessageCircle className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integração WhatsApp</h1>
        <p className="text-gray-600">Central de conversas e comunicação com leads</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' && <CheckCircle size={16} className="mr-2" />}
            {toast.type === 'error' && <AlertTriangle size={16} className="mr-2" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* WhatsApp Bot Connection Panel */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center justify-center">
              <Smartphone className="text-white mr-3" size={28} />
              <h2 className="text-2xl font-bold text-white">Conexão com WhatsApp (Render)</h2>
            </div>
          </div>
          
          <div className="p-8">
            {/* Configuration Section */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="mr-2 text-gray-700" size={20} />
                Configuração do Bot
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Bot (Render)
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://acasa-wa-bot.onrender.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token de Autenticação
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                      placeholder="Token do HUB_TOKEN configurado no Render"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveConfig}
                    disabled={!baseUrl.trim() || !token.trim()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} className="mr-2" />
                    Salvar Configuração
                  </button>
                  
                  <button
                    onClick={() => setShowTestModal(true)}
                    disabled={!isConfigured || !botStatus?.ready}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} className="mr-2" />
                    Testar Envio
                  </button>
                </div>
              </div>
            </div>

            {/* Status Section */}
            {isConfigured && (
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Smartphone className="mr-2 text-gray-700" size={20} />
                    Status da Conexão
                  </h3>
                  <button
                    onClick={checkBotStatus}
                    disabled={loading}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Zap size={16} className="mr-2" />
                    )}
                    Verificar
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">Verificando status...</span>
                  </div>
                ) : botStatus ? (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {botStatus.ready ? (
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                            <Wifi className="text-green-600 mr-2" size={20} />
                            <span className="text-green-700 font-semibold">Online</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                            <WifiOff className="text-red-600 mr-2" size={20} />
                            <span className="text-red-700 font-semibold">Offline</span>
                          </div>
                        )}
                      </div>
                      
                      {lastStatusCheck && (
                        <span className="text-xs text-gray-500">
                          Última verificação: {lastStatusCheck.toLocaleTimeString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Connection Info */}
                    {botStatus.ready && botStatus.me && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">WhatsApp Conectado</h4>
                        <div className="space-y-1 text-sm text-green-700">
                          <div><strong>Número:</strong> {botStatus.me.number}</div>
                          <div><strong>Nome:</strong> {botStatus.me.pushname}</div>
                          <div><strong>Status:</strong> Pronto para enviar e receber mensagens</div>
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                          Conectado via Render • sessão salva em disco
                        </p>
                      </div>
                    )}

                    {/* QR Code Section */}
                    {!botStatus.ready && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                          <QrCode className="mr-2" size={18} />
                          Escaneie o QR para conectar o WhatsApp
                        </h4>
                        
                        {qrLoading ? (
                          <div className="text-center">
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                              <span className="ml-3 text-yellow-700">Gerando QR Code...</span>
                            </div>
                          </div>
                        ) : qrDataUrl ? (
                          <div className="text-center">
                            <img 
                              src={qrDataUrl} 
                              alt="QR Code WhatsApp" 
                              className="mx-auto mb-3 border border-yellow-300 rounded-lg"
                              style={{ maxWidth: '200px' }}
                            />
                            <p className="text-sm text-yellow-700 mb-2">
                              Abra o WhatsApp no seu celular e escaneie este código
                            </p>
                            <p className="text-xs text-yellow-600">
                              QR estável • Gerado às {new Date(lastQrGenerated).toLocaleTimeString('pt-BR')}
                            </p>
                            <p className="text-xs text-yellow-500 mt-1">
                              Aponte a câmera do WhatsApp para este código
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <button
                              onClick={fetchQrCode}
                              disabled={qrLoading}
                              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mx-auto"
                            >
                              {qrLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <QrCode size={16} className="mr-2" />
                              )}
                              {qrLoading ? 'Gerando...' : 'Gerar QR Code'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : isConfigured ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-red-600 text-4xl mb-3">⚠️</div>
                    <h4 className="font-semibold text-red-800 mb-1">Bot Indisponível</h4>
                    <p className="text-sm text-red-700 mb-3">
                      Não foi possível conectar ao bot. Verifique:
                    </p>
                    <ul className="text-xs text-red-600 text-left max-w-sm mx-auto space-y-1">
                      <li>• URL do bot está correta</li>
                      <li>• Token (HUB_TOKEN) está configurado</li>
                      <li>• Bot está rodando no Render</li>
                      <li>• CORS permite esta origem</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {botStatus?.ready ? '✓' : '○'}
                </div>
                <div className="text-sm text-gray-600">Conexão WhatsApp</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-600">Mensagens (em breve)</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-600">Leads (em breve)</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">-</div>
                <div className="text-sm text-gray-600">Último (em breve)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Send Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Testar Envio</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Telefone
                </label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="5521999999999 ou (21) 99999-9999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Com código do país (55) e DDD
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Teste
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Olá! Este é um teste de envio do bot da ACASA."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTestSend}
                  disabled={testLoading || !testPhone.trim() || !testMessage.trim()}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send size={16} className="mr-2" />
                  )}
                  Enviar Teste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Instruções de Setup</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Smartphone className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium">1. Deploy no Render</h4>
                  <p className="text-blue-700">Configure o bot no Render com as variáveis de ambiente necessárias</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Settings className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium">2. Configurar Acesso</h4>
                  <p className="text-blue-700">Insira a URL do bot e o token de autenticação acima</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <QrCode className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium">3. Parear WhatsApp</h4>
                  <p className="text-blue-700">Escaneie o QR code com o WhatsApp Business</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CheckCircle className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium">4. Pronto!</h4>
                  <p className="text-blue-700">Bot conectado e pronto para receber leads</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};