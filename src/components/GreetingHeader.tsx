import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface GreetingHeaderProps {
    user: any;
    displayName: string;
    activeThemeColor: string;
    bgTheme: { text: string; subText: string; id: string };
    fontSizeScale: number;
    onLoginPress: () => void;
}

export function GreetingHeader({ user, displayName, activeThemeColor, bgTheme, fontSizeScale, onLoginPress }: GreetingHeaderProps) {
    return (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                        style={[
                            styles.greeting,
                            {
                                color: user ? bgTheme.subText : bgTheme.text,
                                fontSize: 22 * fontSizeScale,
                                textShadowColor: bgTheme.id === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.15)',
                                textShadowOffset: { width: 0, height: 1.5 },
                                textShadowRadius: 3
                            }
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                    >
                        {user ? (
                            <>
                                こんにちは、
                                <Text style={{ color: activeThemeColor }}>{displayName}</Text>
                                さん！
                            </>
                        ) : 'こんにちは！'}
                    </Text>
                    <Text style={[
                        styles.subtitle,
                        {
                            color: bgTheme.subText,
                            fontSize: 14 * fontSizeScale,
                            textShadowColor: bgTheme.id === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.12)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2
                        }
                    ]}>今日は何を作りますか？</Text>
                </View>
                {!user && (
                    <TouchableOpacity
                        style={[styles.loginBtn, { backgroundColor: activeThemeColor }]}
                        onPress={onLoginPress}
                    >
                        <Text style={styles.loginBtnText}>ログイン/登録</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24, // 少し広げて余白感を出す
        backgroundColor: 'transparent',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    subtitle: {
        opacity: 0.9,
    },
    loginBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
