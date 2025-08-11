interface BotStatus {
  ready: boolean;
  me?: {
    number: string;
    pushname: string;
  };
}

interface QrResponse {
  dataUrl?: string;
  generatedAt?: number;
  message?: string;
}

interface SendMessageResponse {
  ok: boolean;
  error?: string;
}

export async function getStatus(baseUrl: string, token: string): Promise<BotStatus> {
  // Validate inputs
  if (!baseUrl || !token) {
    throw new Error('URL do bot e token são obrigatórios');
  }

  const response = await fetch(`${baseUrl}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token de autenticação inválido');
    } else if (response.status === 404) {
      throw new Error('Serviço do bot não encontrado');
    } else {
      throw new Error(`Erro de conexão: ${response.status}. Verifique se o bot está rodando.`);
    }
  }

  return response.json();
}

export async function getQr(baseUrl: string, token: string): Promise<QrResponse> {
  // Validate inputs
  if (!baseUrl || !token) {
    throw new Error('URL do bot e token são obrigatórios');
  }

  // Ensure baseUrl has protocol
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  const response = await fetch(`${baseUrl}/qr`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    // Add timeout and other fetch options for better error handling
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('Token de autenticação inválido. Verifique o HUB_TOKEN.');
    } else if (response.status === 404) {
      throw new Error('Endpoint /qr não encontrado. Verifique se o bot está rodando.');
    } else {
      throw new Error(`Bot não responde (${response.status}). Verifique se o serviço está rodando.`);
    }
  }

  return response.json();
}

export async function sendMessage(
  baseUrl: string, 
  token: string, 
  to: string, 
  message: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${baseUrl}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) {
    throw new Error(`Send message failed: ${response.status}`);
  }

  return response.json();
}