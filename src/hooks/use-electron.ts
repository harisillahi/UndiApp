import { useState, useEffect } from 'react';

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!(window as any).electronAPI);
  }, []);

  return {
    isElectron,
    electronAPI: isElectron ? (window as any).electronAPI : null
  };
}
