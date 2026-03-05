import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface AdBannerHorizontalProps {
    sponsorName: string;
    title: string;
    imageUrl?: string;
}

export const AdBannerHorizontal: React.FC<AdBannerHorizontalProps> = ({ sponsorName, title, imageUrl }) => {
    const { activeTheme, bgTheme } = useTheme();

    const handlePress = () => {
        Alert.alert('スポンサー広告', 'こちらはサンプル広告です。');
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '33' }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <View style={[styles.image, { backgroundColor: bgTheme.surface }]}>
                        <Ionicons name="image-outline" size={30} color={bgTheme.subText} />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.adBadge, { backgroundColor: activeTheme.color + '15' }]}>
                        <Text style={[styles.adBadgeText, { color: activeTheme.color }]}>PR</Text>
                    </View>
                    <Text style={[styles.sponsorName, { color: bgTheme.subText }]} numberOfLines={1}>{sponsorName}</Text>
                </View>
                <Text style={[styles.title, { color: bgTheme.text }]} numberOfLines={1}>{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={activeTheme.color} style={styles.arrow} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    adBadge: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    adBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    sponsorName: {
        fontSize: 11,
        fontWeight: '600',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    arrow: {
        marginLeft: 4,
    }
});
