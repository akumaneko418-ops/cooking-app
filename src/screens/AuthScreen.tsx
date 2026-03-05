import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AuthScreen({ navigation }: any) {
    const { signIn, signUp, user } = useAuth();
    const { activeTheme, bgTheme } = useTheme();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const emailRef = React.useRef<TextInput>(null);
    const passwordRef = React.useRef<TextInput>(null);

    const [isCodeSent, setIsCodeSent] = useState(false);

    // ログイン状態になったら自動で閉じる
    useEffect(() => {
        if (user) {
            navigation.goBack();
        }
    }, [user, navigation]);

    const handleSubmit = async () => {
        setErrorMsg(null);
        if (!email.trim() || !password.trim()) {
            setErrorMsg('メールアドレスとパスワードを入力してください');
            return;
        }
        if (mode === 'signup' && (!nickname.trim() || nickname.length > 10)) {
            setErrorMsg('ニックネームは10文字以内で入力してください');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('パスワードは6文字以上にしてください');
            return;
        }

        setLoading(true);
        const error = mode === 'login'
            ? await signIn(email.trim(), password)
            : await signUp(email.trim(), password, nickname.trim());
        setLoading(false);

        if (error) {
            setErrorMsg(error);
        } else if (mode === 'signup') {
            setIsCodeSent(true);
        } else {
            // ログイン成功 → ナビゲーションが自動で切り替わる（AuthContext経由）
            navigation.goBack();
        }
    };

    if (isCodeSent) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: bgTheme.bg }]}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="checkmark-circle-outline" size={80} color={activeTheme.color} />
                    <Text style={[styles.appName, { color: bgTheme.text, marginTop: 24 }]}>登録リクエスト完了</Text>
                    <Text style={[styles.subtitle, { color: bgTheme.subText, textAlign: 'center', marginTop: 16 }]}>
                        {email} のアカウント登録処理を行いました。{"\n"}
                        確認メールが届いた場合はリンクをタップしてください。{"\n"}
                        （確認不要の設定時はそのままログインできます）
                    </Text>
                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: activeTheme.color, width: '100%', marginTop: 40 }]}
                        onPress={() => {
                            setIsCodeSent(false);
                            setMode('login');
                        }}
                    >
                        <Text style={styles.submitText}>ログイン画面へ</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgTheme.bg }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.skipBtn}>
                        <Text style={[styles.skipText, { color: bgTheme.subText }]}>スキップ</Text>
                    </TouchableOpacity>
                </View>

                {/* アイコン */}
                <View style={styles.iconArea}>
                    <Ionicons name="restaurant" size={56} color={activeTheme.color} />
                    <Text style={[styles.appName, { color: bgTheme.text }]}>Cooking App</Text>
                    <Text style={[styles.subtitle, { color: bgTheme.subText }]}>
                        {mode === 'login' ? 'ログインしてお気に入りを同期' : '新規アカウント作成'}
                    </Text>
                </View>

                {/* タブ切り替え */}
                <View style={[styles.tabRow, { backgroundColor: bgTheme.surface }]}>
                    {(['login', 'signup'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, mode === tab && { backgroundColor: activeTheme.color + 'E6' }]}
                            onPress={() => {
                                setMode(tab);
                                setErrorMsg(null);
                            }}
                        >
                            <Text style={[styles.tabText, { color: mode === tab ? '#fff' : bgTheme.subText }]}>
                                {tab === 'login' ? 'ログイン' : '新規登録'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* フォーム */}
                <View style={styles.form}>
                    {mode === 'signup' && (
                        <View style={[
                            styles.inputContainer,
                            { backgroundColor: bgTheme.surface },
                            focusedField === 'nickname' && { borderColor: activeTheme.color, borderWidth: 2, ...Platform.select({ web: { boxShadow: `0 0 0 4px ${activeTheme.color}22` } as any }) }
                        ]}>
                            <Ionicons name="person-outline" size={18} color={focusedField === 'nickname' ? activeTheme.color : bgTheme.subText} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: bgTheme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                placeholder="ニックネーム"
                                placeholderTextColor={bgTheme.subText}
                                value={nickname}
                                onChangeText={(v) => { setNickname(v); setErrorMsg(null); }}
                                onFocus={() => setFocusedField('nickname')}
                                onBlur={() => setFocusedField(null)}
                                autoCapitalize="none"
                                maxLength={10}
                                returnKeyType="next"
                                onSubmitEditing={() => emailRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>
                    )}

                    <View style={[
                        styles.inputContainer,
                        { backgroundColor: bgTheme.surface },
                        focusedField === 'email' && { borderColor: activeTheme.color, borderWidth: 2, ...Platform.select({ web: { boxShadow: `0 0 0 4px ${activeTheme.color}22` } as any }) }
                    ]}>
                        <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? activeTheme.color : bgTheme.subText} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: bgTheme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                            placeholder="メールアドレス"
                            placeholderTextColor={bgTheme.subText}
                            ref={emailRef}
                            value={email}
                            onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                    </View>

                    <View style={[
                        styles.inputContainer,
                        { backgroundColor: bgTheme.surface },
                        focusedField === 'password' && { borderColor: activeTheme.color, borderWidth: 2, ...Platform.select({ web: { boxShadow: `0 0 0 4px ${activeTheme.color}22` } as any }) }
                    ]}>
                        <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? activeTheme.color : bgTheme.subText} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: bgTheme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                            placeholder="パスワード（6文字以上）"
                            placeholderTextColor={bgTheme.subText}
                            ref={passwordRef}
                            value={password}
                            onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            secureTextEntry={!showPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={focusedField === 'password' ? activeTheme.color : bgTheme.subText}
                            />
                        </TouchableOpacity>
                    </View>

                    {errorMsg && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: activeTheme.color }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.submitText}>{mode === 'login' ? 'ログイン' : 'アカウント作成'}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 24 },
    header: { alignItems: 'flex-end', paddingTop: 8, paddingBottom: 4 },
    skipBtn: { padding: 8 },
    skipText: { fontSize: 14 },
    iconArea: { alignItems: 'center', paddingVertical: 32 },
    appName: { fontSize: 26, fontWeight: 'bold', marginTop: 12 },
    subtitle: { fontSize: 14, marginTop: 6 },
    tabRow: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabText: { fontSize: 14, fontWeight: 'bold' },
    form: { gap: 12 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15 },
    submitBtn: {
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B3015',
        padding: 10,
        borderRadius: 8,
        marginTop: 4,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 6,
        flex: 1,
    }
});
