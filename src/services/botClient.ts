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
  const response = await fetch(`${baseUrl}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Status request failed: ${response.status}`);
  }

  return response.json();
}

export async function getQr(baseUrl: string, token: string): Promise<QrResponse> {
  const response = await fetch(`${baseUrl}/qr`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`QR request failed: ${response.status}`);
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