import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (email: string, password: string, nickname?: string) => Promise<string | null>;
    updateNickname: (nickname: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signIn: async () => null,
    signUp: async () => null,
    updateNickname: async () => null,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 起動時に既存セッションを取得
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // セッション変化を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const translateError = (message: string): string => {
        if (message === 'Email not confirmed') {
            return 'メールアドレスの確認が完了していません。送られたメール内のリンクをタップして確認を完了してください。';
        }
        if (message === 'Invalid login credentials') {
            return 'メールアドレスまたはパスワードが正しくありません。';
        }
        if (message === 'User already registered') {
            return 'このメールアドレスは既に登録されています。';
        }
        if (message === 'Email signups are disabled' || message === 'Signups not allowed for this version') {
            return '新規登録が現在無効になっています。Supabase ダッシュボードの「Allow new users to sign up」がONになっているか確認してください。';
        }
        return message;
    };

    const signIn = async (email: string, password: string): Promise<string | null> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? translateError(error.message) : null;
    };

    const signUp = async (email: string, password: string, nickname?: string): Promise<string | null> => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: nickname
                }
            }
        });
        return error ? translateError(error.message) : null;
    };

    const updateNickname = async (nickname: string): Promise<string | null> => {
        const { error } = await supabase.auth.updateUser({
            data: { display_name: nickname }
        });
        return error ? translateError(error.message) : null;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signUp, updateNickname, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
