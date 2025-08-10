import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Smartphone, Send, Phone, User, MapPin, Clock, Settings, Shield, CheckCircle, AlertTriangle, X, ArrowLeft, MoreVertical, Search, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useBotConfig } from '../../hooks/useBotConfig';
import { getStatus, sendMessage, getQr } from '../../services/botClient';
import { formatPhone, getStageConfig } from '../../types/crm';
import { Lead, WhatsAppMessage } from '../../types/crm';

export const CRMInbox: React.FC = () => {
  // Bot status
  const [botStatus, setBotStatus] = useState<any>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // Chat interface state
    if (isConfigured) {
      checkBotStatus();
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

 // Auto-refresh status when online

 const checkBotStatus = async () => {
   if (!baseUrl || !token) return;

   try {
     const status = await getStatus(baseUrl, token);
     setBotStatus(status);
     setLastStatusCheck(new Date());
     
     if (status.ready) {
       showToast('success', 'WhatsApp conectado!');
       setQrCode(null); // Clear QR when ready
       setQrError(null);
     }
   } catch (error) {
     console.error('Error checking bot status:', error);
     setBotStatus(null);
     showToast('error', 'Erro de conexão com o bot');
   }
 };

  const fetchQrCode = async () => {
    if (!baseUrl || !token || botStatus?.ready) return;

    setQrLoading(true);
    setQrError(null);
    
    try {
      const response = await getQr(baseUrl, token);
      
      if (response.dataUrl) {
        setQrCode(response.dataUrl);
        setQrError(null);
      } else if (response.message === 'already_ready') {
        checkBotStatus(); // Refresh status
      } else {
        setQrError('QR code não disponível');
      }
    } catch (error) {
      console.error('Error fetching QR:', error);
      setQrError('Erro ao buscar QR code');
    } finally {
      setQrLoading(false);
    }
  };

 const handleSaveConfig = () => {

             </div>
           ) : !botStatus?.ready ? (
              // QR Code Pairing Interface
              <div className="p-6">
                <div className="text-center mb-6">
                  <Smartphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Conectar WhatsApp</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Escaneie o QR code com seu WhatsApp para conectar
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="bg-white rounded-lg border-2 border-gray-200 p-6 text-center">
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
                        alt="QR Code" 
                        className="mx-auto mb-4 border border-gray-300 rounded-lg"
                        style={{ width: '256px', height: '256px' }}
                      />
                      <div className="text-sm text-gray-600 space-y-2">
                        <p className="font-medium">📱 Como conectar:</p>
                        <ol className="text-left space-y-1 max-w-xs mx-auto">
                          <li>1. Abra o WhatsApp no seu celular</li>
                          <li>2. Toque em ⋮ (três pontos) e selecione "Dispositivos conectados"</li>
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

                {/* Instructions */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Dicas importantes:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• O QR code expira em 45 segundos e será atualizado automaticamente</li>
                    <li>• Mantenha o WhatsApp Business ativo no celular após conectar</li>
                    <li>• Após conectar, as conversas dos leads aparecerão aqui</li>
                    <li>• Se der erro, tente limpar a sessão nas configurações do Render</li>
                  </ul>
                </div>
              </div>
           ) : filteredLeads.length > 0 ? (
             <div className="divide-y divide-gray-200">