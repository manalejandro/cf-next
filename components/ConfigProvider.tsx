"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getConfigFromStorage, saveConfigToStorage, clearConfigFromStorage } from "@/lib/utils";

interface CFConfig {
  apiToken: string;
  accountId?: string;
  accountName?: string;
}

interface ConfigContextValue {
  config: CFConfig | null;
  setConfig: (config: CFConfig) => void;
  clearConfig: () => void;
  isConfigured: boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<CFConfig | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = getConfigFromStorage();
    if (stored) setConfigState(stored);
    setLoaded(true);
  }, []);

  const setConfig = useCallback((c: CFConfig) => {
    setConfigState(c);
    saveConfigToStorage(c);
  }, []);

  const clearConfig = useCallback(() => {
    setConfigState(null);
    clearConfigFromStorage();
  }, []);

  if (!loaded) return null;

  return (
    <ConfigContext.Provider value={{ config, setConfig, clearConfig, isConfigured: !!config?.apiToken }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
