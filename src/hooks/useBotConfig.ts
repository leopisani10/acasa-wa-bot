import { useState, useEffect } from 'react';

interface BotConfig {
  baseUrl: string;
  token: string;
}

export const useBotConfig = () => {
  const [config, setConfig] = useState<BotConfig>({
    baseUrl: '',
    token: '',
  });

  useEffect(() => {
    // Load from localStorage on mount
    const savedConfig = localStorage.getItem('acasa_bot_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Error parsing bot config from localStorage:', error);
      }
    }
  }, []);

  const saveConfig = (newConfig: BotConfig) => {
    setConfig(newConfig);
    localStorage.setItem('acasa_bot_config', JSON.stringify(newConfig));
  };

  const clearConfig = () => {
    setConfig({ baseUrl: '', token: '' });
    localStorage.removeItem('acasa_bot_config');
  };

  return {
    config,
    saveConfig,
    clearConfig,
    isConfigured: config.baseUrl && config.token,
  };
};