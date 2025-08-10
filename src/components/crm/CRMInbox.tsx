import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Smartphone, Send, Phone, User, MapPin, Clock, Settings, Shield, CheckCircle, AlertTriangle, X, ArrowLeft, MoreVertical, Search, Filter, Plus, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useBotConfig } from '../../hooks/useBotConfig';
import { getStatus, sendMessage, getQr } from '../../services/botClient';
import { formatPhone, getStageConfig } from '../../types/crm';
import { Lead, WhatsAppMessage } from '../../types/crm';

export const CRMInbox: React.FC = () => {
  const { user } = useAuth();
  const { leads, updateLeadStage } = useCRM();
  const { config, saveConfig, clearConfig, isConfigured } = useBotConfig();
  
  // Bot configuration state
  const [showConfig, setShowConfig] = useState(!isConfigured);
  const [configForm, setConfigForm] = useState({
    baseUrl: config.baseUrl,
    token: config.token,
  });
  
  // Bot status
  const [botStatus, setBotStatus] = useState<any>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // Chat interface state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter leads with phone numbers (potential WhatsApp contacts)
  const whatsappLeads = leads.filter(lead => lead.contact?.phone);
  
  const filteredLeads = whatsappLeads.filter(lead =>
    !searchTerm || 
    lead.contact?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact?.phone?.includes(searchTerm) ||
    lead.elderly_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isConfigured) {
      checkBotStatus();
      const interval = setInterval(checkBotStatus, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [isConfigured, config]);

  // Auto-fetch QR when bot is offline
  useEffect(() => {
    if (isConfigured && botStatus !== null && !botStatus.ready) {
      fetchQrCode();
      
      // Auto-refresh QR every 45 seconds
      const qrInterval = setInterval(() => {
        fetchQrCode();
      }, 45000);
      
      return () => clearInterval(qrInterval);
    } else {
      setQrCode(null);
      setQrError(null);
    }
  }, [isConfigured, botStatus?.ready]);

  const checkBotStatus = async () => {
    if (!config.baseUrl || !config.token) return;

    try {
      console.log('Checking bot status...', config.baseUrl);
      const status = await getStatus(config.baseUrl, config.token);
      console.log('Bot status response:', status);
      setBotStatus(status);
      setLastStatusCheck(new Date());
      
      if (status.ready && qrCode) {
        setQrCode(null); // Clear QR when ready
        setQrError(null);
      }
    } catch (error) {
      console.error('Error checking bot status:', error);
      setBotStatus({ ready: false, error: error.message });
    }
  };

  const fetchQrCode = async () => {
    if (!config.baseUrl || !config.token || botStatus?.ready) return;

    console.log('Fetching QR code...', config.baseUrl);
    setQrLoading(true);
    setQrError(null);
    
    try {
      const response = await getQr(config.baseUrl, config.token);
      console.log('QR response:', response);
      
      if (response.dataUrl) {
        setQrCode(response.dataUrl);
        setQrError(null);
      } else if (response.message?.includes('already_ready')) {
        checkBotStatus(); // Refresh status
      } else {
        setQrError(response.message || 'QR code não disponível');
      }
    } catch (error) {
      console.error('Error fetching QR:', error);
      setQrError(`Erro: ${error.message || 'Falha na conexão'}`);
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveConfig = () => {
    if (!configForm.baseUrl || !configForm.token) {
      alert('URL e Token são obrigatórios');
      return;
    }
    
    saveConfig(configForm);
    setShowConfig(false);
    // Reset states
    setBotStatus(null);
    setQrCode(null);
    setQrError(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedLead?.contact?.phone || sendingMessage) return;

    setSendingMessage(true);
    try {
      await sendMessage(config.baseUrl, config.token, selectedLead.contact.phone, newMessage);
      
      // Add message to local state (optimistic update)
      const sentMessage: WhatsAppMessage = {
        id: Date.now().toString(),
        lead_id: selectedLead.id,
        wa_from: botStatus?.me?.number || 'bot',
        wa_to: selectedLead.contact.phone,
        direction: 'outbound',
        body: newMessage,
        wa_msg_id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Verifique a conexão.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Only allow admins to access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Acesso Negado</h2>
          <p className="text-red-700">Apenas administradores podem acessar o CRM Inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl mr-4">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM Inbox</h1>
              <p className="text-gray-600">Central de mensagens WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Configurar Bot
            </button>
            {botStatus && (
              <div className={`flex items-center px-3 py-2 rounded-lg ${
                botStatus.ready 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  botStatus.ready ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {botStatus.ready ? 'WhatsApp Conectado' : 'WhatsApp Offline'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Configurar Bot WhatsApp</h2>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Bot *
                </label>
                <input
                  type="url"
                  value={configForm.baseUrl}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://seu-bot.onrender.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token de Autenticação *
                </label>
                <input
                  type="password"
                  value={configForm.token}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, token: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="HUB_TOKEN configurado no Render"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">ℹ️ Como configurar:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Acesse seu bot no Render</li>
                  <li>2. Copie a URL (ex: https://acasa-wa-bot.onrender.com)</li>
                  <li>3. Use o mesmo HUB_TOKEN das variáveis de ambiente</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  clearConfig();
                  setConfigForm({ baseUrl: '', token: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!isConfigured ? (
          /* Configuration Required */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Settings className="text-yellow-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuração Necessária</h2>
              <p className="text-gray-600 mb-6">
                Configure a conexão com o bot WhatsApp para começar a receber e enviar mensagens.
              </p>
              <button
                onClick={() => setShowConfig(true)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Settings size={20} className="mr-2" />
                Configurar Bot
              </button>
            </div>
          </div>
        ) : !botStatus ? (
          /* Loading Status */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verificando status do bot...</p>
            </div>
          </div>
        ) : !botStatus.ready ? (
          /* QR Code Pairing Interface */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Smartphone className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Conectar WhatsApp</h2>
              <p className="text-gray-600 mb-6">
                Escaneie o QR code com seu WhatsApp para conectar o bot.
              </p>

              {/* QR Code Display */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                {qrLoading ? (
                  <div className="py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Gerando QR code...</p>
                  </div>
                ) : qrError ? (
                  <div className="py-8">
                    <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-4" />
                    <p className="text-sm text-red-600 mb-4">{qrError}</p>
                    <button
                      onClick={fetchQrCode}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : qrCode ? (
                  <div>
                    <img 
                      src={qrCode} 
                      alt="QR Code WhatsApp" 
                      className="mx-auto mb-4 border border-gray-300 rounded-lg"
                      style={{ width: '256px', height: '256px' }}
                    />
                    <div className="text-sm text-gray-600 space-y-2">
                      <p className="font-medium">📱 Como conectar:</p>
                      <ol className="text-left space-y-1 max-w-xs mx-auto">
                        <li>1. Abra o WhatsApp no seu celular</li>
                        <li>2. Toque em ⋮ (três pontos) → "Dispositivos conectados"</li>
                        <li>3. Toque em "Conectar um dispositivo"</li>
                        <li>4. Escaneie este QR code</li>
                      </ol>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={fetchQrCode}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        🔄 Atualizar QR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <Smartphone className="mx-auto h-8 w-8 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">Preparando conexão...</p>
                    <button
                      onClick={fetchQrCode}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Gerar QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* Status Info */}
              <div className="mt-6 text-left">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📊 Status da Conexão:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Bot URL: <code className="bg-blue-100 px-1 rounded">{config.baseUrl}</code></div>
                    <div>Status: <span className="font-medium">{botStatus.ready ? 'Conectado' : 'Aguardando QR'}</span></div>
                    {lastStatusCheck && (
                      <div>Última verificação: {lastStatusCheck.toLocaleTimeString('pt-BR')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <>
            {/* Sidebar - Lead List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Lead List */}
              <div className="flex-1 overflow-y-auto">
                {filteredLeads.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredLeads.map(lead => {
                      const stageConfig = getStageConfig(lead.stage);
                      
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedLead?.id === lead.id ? 'bg-green-50 border-r-4 border-green-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {(lead.contact?.full_name || 'NN').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate text-sm">
                                    {lead.contact?.full_name || 'Nome não informado'}
                                  </h3>
                                  <p className="text-xs text-gray-600 truncate">
                                    {formatPhone(lead.contact?.phone || '')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                {lead.elderly_name && (
                                  <div>👴 {lead.elderly_name}</div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs ${stageConfig.bgColor} ${stageConfig.textColor}`}>
                                    {stageConfig.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Last message preview */}
                          <div className="mt-2 text-xs text-gray-500">
                            📝 Última mensagem: Nenhuma
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Nenhuma conversa</h3>
                    <p className="text-sm text-gray-600">
                      As conversas aparecerão aqui quando recebermos mensagens no WhatsApp.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedLead ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => setSelectedLead(null)}
                          className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {(selectedLead.contact?.full_name || 'NN').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {selectedLead.contact?.full_name || 'Nome não informado'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatPhone(selectedLead.contact?.phone || '')}
                            {selectedLead.elderly_name && ` • ${selectedLead.elderly_name}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Stage Selector */}
                        <select
                          value={selectedLead.stage}
                          onChange={(e) => updateLeadStage(selectedLead.id, e.target.value as any)}
                          className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="Novo">Novo</option>
                          <option value="Qualificando">Qualificando</option>
                          <option value="Agendou visita">Agendou visita</option>
                          <option value="Visitou">Visitou</option>
                          <option value="Proposta">Proposta</option>
                          <option value="Fechado">Fechado</option>
                          <option value="Perdido">Perdido</option>
                        </select>
                        
                        <a
                          href={`tel:${selectedLead.contact?.phone}`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ligar"
                        >
                          <Phone size={18} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.direction === 'outbound'
                                ? 'bg-green-500 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.body}</p>
                              <p className={`text-xs mt-1 ${
                                message.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem</h3>
                          <p className="text-gray-600">
                            As mensagens trocadas com este lead aparecerão aqui.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Digite sua mensagem..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          rows={1}
                          style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <Send size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* No chat selected */
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <MessageCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">WhatsApp Conectado!</h2>
                    <p className="text-gray-600 mb-4">
                      Selecione uma conversa à esquerda para começar a trocar mensagens.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <h4 className="font-medium text-blue-900 mb-2">💡 Como funciona:</h4>
                      <ul className="text-sm text-blue-800 space-y-1 text-left">
                        <li>• Mensagens chegam automaticamente dos leads</li>
                        <li>• Clique em qualquer lead para abrir o chat</li>
                        <li>• Responda diretamente pela interface</li>
                        <li>• Altere o estágio do lead durante a conversa</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};