import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 用意するテーマカラーの定義
export const THEME_COLORS = {
    coral: { id: 'coral', name: 'コーラル', color: '#FF6F61' },
    mint: { id: 'mint', name: 'ミント', color: '#4CAF50' },
    brown: { id: 'brown', name: 'カフェ', color: '#795548' },
    lemon: { id: 'lemon', name: 'レモン', color: '#FBC02D' },
    lavender: { id: 'lavender', name: 'ラベンダー', color: '#9C27B0' },
};

export const BG_THEMES = {
    light: { id: 'light', name: '標準', bg: '#ffffff', surface: '#f5f5f5', text: '#1a1a1a', subText: '#555555' },
    ivory: { id: 'ivory', name: 'アイボリー', bg: '#FAF3E0', surface: '#F0E6C8', text: '#2E1F0E', subText: '#554838' },
    sky: { id: 'sky', name: 'スカイ', bg: '#EBF4F9', surface: '#D2E9F3', text: '#1A3A4A', subText: '#3A6A86' },
    dark: { id: 'dark', name: 'グレー', bg: '#EAECEF', surface: '#D8DBDF', text: '#1a1a1a', subText: '#444444' },
};

export const GROUP_COLORS = {
    A: '#FF6F61', // コーラル/赤系
    B: '#4ECDC4', // ターコイズ/青緑系
    C: '#D4A017', // ゴールド/濃い黄系 (視認性向上)
};

export const getGroupColor = (group?: string, defaultColor: string = '#666666') => {
    if (group === 'A') return GROUP_COLORS.A;
    if (group === 'B') return GROUP_COLORS.B;
    if (group === 'C') return GROUP_COLORS.C;
    return defaultColor;
};

// 用意する背景パターンの種類
export type BgPatternId = 'none' | 'dots' | 'dots2' | 'stripes' | 'cross' | 'wave' | 'zigzag' | 'checkered' | 'stars' | 'squares' | 'diamonds';

type ThemeId = keyof typeof THEME_COLORS | 'custom';
type BgThemeId = keyof typeof BG_THEMES;

// アクティブテーマの型（プリセット or カスタム共通）
export interface ActiveTheme {
    id: string;
    name: string;
    color: string;
    isCustom?: boolean;
}

interface ThemeContextType {
    activeTheme: ActiveTheme;
    bgTheme: typeof BG_THEMES[BgThemeId];
    bgPattern: BgPatternId;
    setTheme: (id: string) => void;
    setCustomColor: (hex: string) => void;
    customColor: string | null;
    setBgTheme: (id: BgThemeId) => void;
    setBgPattern: (id: BgPatternId) => void;
    isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cooking_app_theme';
const CUSTOM_COLOR_STORAGE_KEY = '@cooking_app_custom_color';
const BG_THEME_STORAGE_KEY = '@cooking_app_bg_theme';
const BG_PATTERN_STORAGE_KEY = '@cooking_app_bg_pattern';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [activeThemeId, setActiveThemeId] = useState<string>('coral');
    const [activeBgThemeId, setActiveBgThemeId] = useState<BgThemeId>('light');
    const [customColor, setCustomColorState] = useState<string | null>(null);
    const [bgPattern, setBgPatternState] = useState<BgPatternId>('none');
    const [isLoaded, setIsLoaded] = useState(false);

    // アプリ起動時に保存されたテーマを読み込む
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const [savedTheme, savedBgTheme, savedCustomColor, savedBgPattern] = await Promise.all([
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                    AsyncStorage.getItem(BG_THEME_STORAGE_KEY),
                    AsyncStorage.getItem(CUSTOM_COLOR_STORAGE_KEY),
                    AsyncStorage.getItem(BG_PATTERN_STORAGE_KEY),
                ]);

                if (savedCustomColor) {
                    setCustomColorState(savedCustomColor);
                }
                if (savedTheme) {
                    setActiveThemeId(savedTheme);
                }
                if (savedBgTheme && Object.keys(BG_THEMES).includes(savedBgTheme)) {
                    setActiveBgThemeId(savedBgTheme as BgThemeId);
                }
                if (savedBgPattern && ['none', 'dots', 'dots2', 'stripes', 'cross', 'wave', 'zigzag', 'checkered', 'stars', 'squares', 'diamonds'].includes(savedBgPattern)) {
                    setBgPatternState(savedBgPattern as BgPatternId);
                }
            } catch (error) {
                console.error('テーマの読み込みに失敗しました:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    // テーマを変更し、ストレージに保存する関数
    const handleSetTheme = async (id: string) => {
        setActiveThemeId(id);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
        } catch (error) {
            console.error('テーマの保存に失敗しました:', error);
        }
    };

    // カスタムカラーを設定し、ストレージに保存する関数
    const handleSetCustomColor = async (hex: string) => {
        setCustomColorState(hex);
        setActiveThemeId('custom');
        try {
            await Promise.all([
                AsyncStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, hex),
                AsyncStorage.setItem(THEME_STORAGE_KEY, 'custom'),
            ]);
        } catch (error) {
            console.error('カスタムカラーの保存に失敗しました:', error);
        }
    };

    // 背景テーマを変更し、ストレージに保存する関数
    const handleSetBgTheme = async (id: BgThemeId) => {
        setActiveBgThemeId(id);
        try {
            await AsyncStorage.setItem(BG_THEME_STORAGE_KEY, id);
        } catch (error) {
            console.error('背景テーマの保存に失敗しました:', error);
        }
    };

    // 背景パターンを変更し、ストレージに保存する関数
    const handleSetBgPattern = async (id: BgPatternId) => {
        setBgPatternState(id);
        try {
            await AsyncStorage.setItem(BG_PATTERN_STORAGE_KEY, id);
        } catch (error) {
            console.error('背景パターンの保存に失敗しました:', error);
        }
    };

    // アクティブテーマを計算（カスタムかプリセットか）
    const resolvedTheme: ActiveTheme =
        activeThemeId === 'custom' && customColor
            ? { id: 'custom', name: 'カスタム', color: customColor, isCustom: true }
            : THEME_COLORS[activeThemeId as keyof typeof THEME_COLORS] ?? THEME_COLORS.coral;

    return (
        <ThemeContext.Provider
            value={{
                activeTheme: resolvedTheme,
                bgTheme: BG_THEMES[activeBgThemeId],
                bgPattern,
                setTheme: handleSetTheme,
                setCustomColor: handleSetCustomColor,
                customColor,
                setBgTheme: handleSetBgTheme,
                setBgPattern: handleSetBgPattern,
                isLoaded,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

// コンポーネントから簡単にテーマを呼び出すためのフック
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
