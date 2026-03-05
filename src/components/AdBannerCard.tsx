import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface AdBannerCardProps {
    sponsorName: string;
    title: string;
    imageUrl?: string;
    description: string;
}

export const AdBannerCard: React.FC<AdBannerCardProps> = ({ sponsorName, title, imageUrl, description }) => {
    const { activeTheme, bgTheme } = useTheme();

    const handlePress = () => {
        Alert.alert('スポンサー広告', 'こちらはサンプル広告です。実際の運用では外部サイトや詳細ページに遷移します。');
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '33' }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                <View style={[styles.adBadge, { backgroundColor: activeTheme.color + '15' }]}>
                    <Text style={[styles.adBadgeText, { color: activeTheme.color }]}>PR</Text>
                </View>
                <Text style={[styles.sponsorName, { color: bgTheme.subText }]}>{sponsorName}</Text>
            </View>

            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, { backgroundColor: bgTheme.surface }]}>
                    <Ionicons name="image-outline" size={40} color={bgTheme.subText} />
                </View>
            )}

            <View style={styles.content}>
                <Text style={[styles.title, { color: bgTheme.text }]} numberOfLines={1}>{title}</Text>
                <Text style={[styles.description, { color: bgTheme.subText }]} numberOfLines={2}>
                    {description}
                </Text>

                <View style={[styles.actionBtn, { borderColor: activeTheme.color }]}>
                    <Text style={[styles.actionText, { color: activeTheme.color }]}>詳しく見る</Text>
                    <Ionicons name="chevron-forward" size={14} color={activeTheme.color} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
    },
    adBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    sponsorName: {
        fontSize: 12,
        fontWeight: '600',
    },
    image: {
        width: '100%',
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 4,
    },
    actionText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
});
