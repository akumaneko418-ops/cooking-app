import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LayoutType = 'list' | 'grid2' | 'grid3' | 'compact';

interface LayoutContextType {
    layoutType: LayoutType;
    setLayoutType: (type: LayoutType) => void;
    numColumns: number;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LAYOUT_STORAGE_KEY = '@cooking_app_layout_type';

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [layoutType, setLayoutTypeState] = useState<LayoutType>('list');

    useEffect(() => {
        const loadLayout = async () => {
            try {
                const savedLayout = await AsyncStorage.getItem(LAYOUT_STORAGE_KEY);
                if (savedLayout) {
                    setLayoutTypeState(savedLayout as LayoutType);
                }
            } catch (e) {
                console.error('Failed to load layout type', e);
            }
        };
        loadLayout();
    }, []);

    const setLayoutType = async (type: LayoutType) => {
        setLayoutTypeState(type);
        try {
            await AsyncStorage.setItem(LAYOUT_STORAGE_KEY, type);
        } catch (e) {
            console.error('Failed to save layout type', e);
        }
    };

    const numColumns = (layoutType === 'list' || layoutType === 'compact') ? 1 : layoutType === 'grid2' ? 2 : 3;

    return (
        <LayoutContext.Provider value={{ layoutType, setLayoutType, numColumns }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
