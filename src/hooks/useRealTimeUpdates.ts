import { useState, useEffect } from 'react';

export function useRealTimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Simular conexão com WebSocket/Server-Sent Events
    setIsConnected(true);
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Atualizar a cada 30 segundos

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
  };
}