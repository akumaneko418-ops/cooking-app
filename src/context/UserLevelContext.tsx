// ユーザーのレベル設定をアプリ全体で共有するためのContext（状態管理）
// React.createContextを使った最もシンプルな実装です。
// 将来的には、設定値をサーバーに保存するように拡張できます。

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@user_level';
const DEFAULT_USER_LEVEL = 2; // 初期値は「ふつう（Lv2）」

interface UserLevelContextType {
    userLevel: number;      // 現在のユーザーレベル（1〜3）
    setUserLevel: (level: number) => void;
    filterEnabled: boolean;      // フィルター機能のON/OFF
    setFilterEnabled: (enabled: boolean) => void;
}

const UserLevelContext = createContext<UserLevelContextType>({
    userLevel: DEFAULT_USER_LEVEL,
    setUserLevel: () => { },
    filterEnabled: false,
    setFilterEnabled: () => { },
});

// アプリ全体をこのProviderで包むと、どの画面からでもユーザーレベルを取得・変更できます
export const UserLevelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userLevel, setUserLevelState] = useState(DEFAULT_USER_LEVEL);
    const [filterEnabled, setFilterEnabledState] = useState(false);

    // アプリ起動時に保存済みの設定を読み込む
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedLevel = await AsyncStorage.getItem(STORAGE_KEY);
                if (savedLevel !== null) {
                    setUserLevelState(parseInt(savedLevel, 10));
                }
            } catch (e) {
                console.warn('レベル設定の読み込みに失敗しました:', e);
            }
        };
        loadSettings();
    }, []);

    // レベル設定が変わったら自動保存する
    const setUserLevel = async (level: number) => {
        setUserLevelState(level);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, String(level));
        } catch (e) {
            console.warn('レベル設定の保存に失敗しました:', e);
        }
    };

    const setFilterEnabled = (enabled: boolean) => {
        setFilterEnabledState(enabled);
    };

    return (
        <UserLevelContext.Provider value={{ userLevel, setUserLevel, filterEnabled, setFilterEnabled }}>
            {children}
        </UserLevelContext.Provider>
    );
};

// カスタムフック: 各画面でこれを呼ぶだけでレベル設定を使えます
export const useUserLevel = () => useContext(UserLevelContext);
