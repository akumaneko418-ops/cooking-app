import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUIConfig } from '../context/UIConfigContext';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    type?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
}

import { ActivityIndicator, View } from 'react-native';

export const AppButton: React.FC<ButtonProps> = ({ title, type = 'primary', loading, disabled, style, ...props }) => {
    const { activeTheme } = useTheme();
    const { fontSizeScale } = useUIConfig();

    const getButtonStyle = () => {
        // ... (省略)
        switch (type) {
            case 'secondary':
                return [styles.secondaryButton, { backgroundColor: activeTheme.color + 'E6' }];
            case 'outline':
                return [styles.outlineButton, { borderColor: activeTheme.color }];
            default:
                return [styles.primaryButton, { backgroundColor: activeTheme.color }];
        }
    };

    const getTextStyle = () => {
        switch (type) {
            case 'secondary':
                return [styles.outlineText, { color: '#fff' }];
            case 'outline':
                return [styles.outlineText, { color: activeTheme.color }];
            default:
                return styles.primaryText;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), style, (disabled || loading) && styles.disabledButton]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={type === 'primary' ? '#fff' : activeTheme.color} />
            ) : (
                <Text style={[styles.text, getTextStyle(), { fontSize: 16 * fontSizeScale }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        // 高齢者や子供にも押しやすいよう、タップ領域を広めに設定
        minWidth: 160,
    },
    primaryButton: {
        // backgroundColor: '#FF6F61', // 動的に付与
    },
    secondaryButton: {
        // backgroundColor: '#FFF1E6', // 動的に付与
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        // borderColor: '#FF6F61', // 動的に付与
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryText: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    outlineText: {
        // color: '#FF6F61', // 動的に付与
    },
    disabledButton: {
        opacity: 0.6,
    },
});
