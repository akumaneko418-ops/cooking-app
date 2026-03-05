import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActionsLayoutOrder = 'default' | 'reversed';
export type DetailHeaderOrder = 'image-title' | 'title-image';

interface UIConfig {
    fontSizeScale: number;
}

interface UIConfigContextType extends UIConfig {
    setFontSizeScale: (scale: number) => void;
    resetConfig: () => void;
}

const UI_CONFIG_STORAGE_KEY = '@cooking_app_ui_config';

const DEFAULT_CONFIG: UIConfig = {
    fontSizeScale: 1.0,
};

const UIConfigContext = createContext<UIConfigContextType | undefined>(undefined);

export const UIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<UIConfig>(DEFAULT_CONFIG);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const savedConfig = await AsyncStorage.getItem(UI_CONFIG_STORAGE_KEY);
                if (savedConfig) {
                    setConfigState(JSON.parse(savedConfig));
                }
            } catch (e) {
                console.error('Failed to load UI config', e);
            }
        };
        loadConfig();
    }, []);

    const saveConfig = async (newConfig: UIConfig) => {
        setConfigState(newConfig);
        try {
            await AsyncStorage.setItem(UI_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
        } catch (e) {
            console.error('Failed to save UI config', e);
        }
    };

    const setFontSizeScale = (scale: number) => saveConfig({ ...config, fontSizeScale: scale });
    const resetConfig = () => saveConfig(DEFAULT_CONFIG);

    return (
        <UIConfigContext.Provider value={{
            ...config,
            setFontSizeScale,
            resetConfig
        }}>
            {children}
        </UIConfigContext.Provider>
    );
};

export const useUIConfig = () => {
    const context = useContext(UIConfigContext);
    if (context === undefined) {
        throw new Error('useUIConfig must be used within a UIConfigProvider');
    }
    return context;
};
