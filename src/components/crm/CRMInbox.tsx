import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Smartphone, Send, Phone, User, MapPin, Clock, Settings, Shield, CheckCircle, AlertTriangle, X, ArrowLeft, MoreVertical, Search, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useBotConfig } from '../../hooks/useBotConfig';
import { getStatus, sendMessage } from '../../services/botClient';
import { formatPhone, getStageConfig } from '../../types/crm';
import { Lead, WhatsAppMessage } from '../../types/crm';

export const CRMInbox: React.FC = () => {
  const { user } = useAuth();
  const { config, saveConfig, isConfigured } = useBotConfig();
  const { leads, updateLeadStage } = useCRM();
  
  // Configuration state
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [showConfig, setShowConfig] = useState(!isConfigured);
  
  // Bot status
  const [botStatus, setBotStatus] = useState<any>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  
  // Chat interface state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(statusInterval);
    }
  }, [botStatus?.ready, isConfigured]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock messages for demonstration (in production, fetch from Supabase)
  useEffect(() => {
    if (selectedLead) {
      // Mock messages data
      const mockMessages: WhatsAppMessage[] = [
        {
          id: '1',
          lead_id: selectedLead.id,
          wa_from: selectedLead.contact?.phone || '',
          wa_to: '5521995138800',
          direction: 'inbound',
          body: 'Olá, gostaria de informações sobre residencial para idosos',
          wa_msg_id: 'msg_1',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          lead_id: selectedLead.id,
          wa_from: '5521995138800',
          wa_to: selectedLead.contact?.phone || '',
          direction: 'outbound',
          body: 'Olá! Ficamos felizes com seu interesse. A ACASA oferece cuidados especializados para idosos. Gostaria de agendar uma visita?',
          wa_msg_id: 'msg_2',
          created_at: new Date(Date.now() - 3000000).toISOString(),
        },
        {
          id: '3',
          lead_id: selectedLead.id,
          wa_from: selectedLead.contact?.phone || '',
          wa_to: '5521995138800',
          direction: 'inbound',
          body: 'Sim, gostaria muito. É para minha mãe de 78 anos.',
          wa_msg_id: 'msg_3',
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
      setMessages(mockMessages);
    }
  }, [selectedLead]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const checkBotStatus = async () => {
    if (!baseUrl || !token) return;

    try {
      const status = await getStatus(baseUrl, token);
      setBotStatus(status);
      setLastStatusCheck(new Date());
      
      if (status.ready) {
        showToast('success', 'WhatsApp conectado!');
      }
    } catch (error) {
      console.error('Error checking bot status:', error);
      setBotStatus(null);
      showToast('error', 'Erro de conexão com o bot');
    }
  };

  const handleSaveConfig = () => {
    if (!baseUrl.trim() || !token.trim()) {
      showToast('error', 'URL e Token são obrigatórios');
      return;
    }

    const newConfig = {
      baseUrl: baseUrl.trim().replace(/\/$/, ''),
      token: token.trim(),
    };

    saveConfig(newConfig);
    setShowConfig(false);
    showToast('success', 'Configuração salva!');
    
    setTimeout(() => checkBotStatus(), 500);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || !isConfigured || !botStatus?.ready) return;

    setSendingMessage(true);
    try {
      await sendMessage(config.baseUrl, config.token, selectedLead.contact?.phone || '', newMessage);
      
      // Add message to local state (in production, this would come from webhook/polling)
      const sentMessage: WhatsAppMessage = {
        id: Date.now().toString(),
        lead_id: selectedLead.id,
        wa_from: '5521995138800',
        wa_to: selectedLead.contact?.phone || '',
        direction: 'outbound',
        body: newMessage,
        wa_msg_id: `msg_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      showToast('success', 'Mensagem enviada!');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('error', 'Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getLeadsWithMessages = () => {
    // Filter leads that have WhatsApp contact and group with last message time
    return leads
      .filter(lead => lead.contact?.phone)
      .map(lead => ({
        ...lead,
        lastMessageTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Mock last message
        unreadCount: Math.floor(Math.random() * 3), // Mock unread count
      }))
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  };

  const filteredLeads = getLeadsWithMessages().filter(lead =>
    lead.contact?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact?.phone?.includes(searchTerm) ||
    lead.elderly_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="h-screen flex flex-col">
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg mr-4">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp Business</h1>
              <p className="text-sm text-gray-600">
                {botStatus?.ready ? (
                  <span className="text-green-600">● Conectado • {botStatus.me?.pushname}</span>
                ) : (
                  <span className="text-red-600">● Desconectado</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configurações"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Bot</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="https://seu-bot.onrender.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="HUB_TOKEN"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSaveConfig}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {!isConfigured ? (
              <div className="p-6 text-center">
                <Smartphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Configure o Bot</h3>
                <p className="text-sm text-gray-600 mb-4">Configure a URL e token do bot para ver as conversas</p>
                <button
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Configurar
                </button>
              </div>
            ) : !botStatus?.ready ? (
              <div className="p-6 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">WhatsApp Offline</h3>
                <p className="text-sm text-gray-600">Conecte o WhatsApp para ver as conversas</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Nenhuma Conversa</h3>
                <p className="text-sm text-gray-600">As conversas aparecerão aqui quando chegarem mensagens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const stageConfig = getStageConfig(lead.stage);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedLead?.id === lead.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(lead.contact?.full_name || 'NN').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {lead.contact?.full_name || 'Nome não informado'}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(lead.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {lead.elderly_name && `${lead.elderly_name} • `}
                            {formatPhone(lead.contact?.phone || '')}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageConfig.bgColor} ${stageConfig.textColor}`}>
                              {stageConfig.label}
                            </span>
                            {lead.unreadCount > 0 && (
                              <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {lead.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedLead ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Selecione uma Conversa</h3>
                <p className="text-gray-600">Escolha um lead na lista para ver as mensagens</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3 md:hidden"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {(selectedLead.contact?.full_name || 'NN').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedLead.contact?.full_name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone size={12} />
                        <span>{formatPhone(selectedLead.contact?.phone || '')}</span>
                        {selectedLead.elderly_name && (
                          <>
                            <span>•</span>
                            <span>{selectedLead.elderly_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedLead.stage}
                      onChange={(e) => updateLeadStage(selectedLead.id, e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Qualificando">Qualificando</option>
                      <option value="Agendou visita">Agendou visita</option>
                      <option value="Visitou">Visitou</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Fechado">Fechado</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Nenhuma mensagem ainda</h3>
                    <p className="text-gray-600">Inicie a conversa enviando uma mensagem</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.direction === 'outbound'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.body}</p>
                          <p className={`text-xs mt-1 ${
                            message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem..."
                      disabled={!botStatus?.ready || sendingMessage}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !botStatus?.ready || sendingMessage}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              {botStatus?.ready ? '🟢 Online' : '🔴 Offline'}
            </span>
            <span>{filteredLeads.length} conversas</span>
            {lastStatusCheck && (
              <span>Última verificação: {lastStatusCheck.toLocaleTimeString('pt-BR')}</span>
            )}
          </div>
          {selectedLead && (
            <span>
              Conversa com {selectedLead.contact?.full_name} • {messages.length} mensagens
            </span>
          )}
        </div>
      </div>
    </div>
  );
};