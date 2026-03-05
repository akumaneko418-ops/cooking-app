import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getFeedbacks, deleteFeedback, markFeedbacksAsRead, getLastReadTimestamp, Feedback } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import BackgroundPattern from '../components/BackgroundPattern';

export default function AdminFeedbackScreen({ navigation }: any) {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [previousReadTime, setPreviousReadTime] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const { activeTheme, bgTheme } = useTheme();

    const loadFeedbacks = async () => {
        const data = await getFeedbacks();
        setFeedbacks(data);
    };

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                const lastTimestamp = await getLastReadTimestamp();
                setPreviousReadTime(lastTimestamp);
                await loadFeedbacks();
                await markFeedbacksAsRead(); // 開いたら既読にする
            };
            init();
        }, [])
    );

    const handleDelete = (id: string) => {
        Alert.alert(
            '確認',
            'このフィードバックを削除してもよろしいですか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteFeedback(id);
                        loadFeedbacks();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Feedback }) => (
        <View style={[styles.card, { backgroundColor: bgTheme.surface, borderColor: activeTheme.color + '20' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle-outline" size={24} color={activeTheme.color} />
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.userName, { color: bgTheme.text }]}>{item.userName}</Text>
                            {item.createdAt > previousReadTime && (
                                <View style={styles.newBadge}>
                                    <Text style={styles.newBadgeText}>新着</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.userId, { color: bgTheme.subText }]}>ID: {item.userId.substring(0, 8)}...</Text>
                    </View>
                </View>
                <Text style={[styles.date, { color: bgTheme.subText }]}>
                    {new Date(item.createdAt).toLocaleString('ja-JP')}
                </Text>
            </View >
            <View style={styles.contentContainer}>
                <Text style={[styles.content, { color: bgTheme.text }]}>{item.content}</Text>
            </View>

            {item.attachmentUrl && (
                <TouchableOpacity
                    style={styles.attachmentPreview}
                    onPress={() => setFullscreenImage(item.attachmentUrl || null)}
                    activeOpacity={0.8}
                >
                    <Image source={{ uri: item.attachmentUrl }} style={styles.attachmentImage} resizeMode="cover" />
                    <View style={styles.zoomOverlay}>
                        <Ionicons name="expand-outline" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                activeOpacity={0.7}
            >
                <Ionicons name="trash-outline" size={20} color="#FF6F61" />
                <Text style={styles.deleteBtnText}>削除</Text>
            </TouchableOpacity>
        </View >
    );

    return (
        <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <BackgroundPattern />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={activeTheme.color} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: bgTheme.text }]}>受信フィードバック</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={feedbacks}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="mail-unread-outline" size={64} color="#ccc" />
                        <Text style={[styles.emptyText, { color: bgTheme.subText }]}>現在フィードバックはありません</Text>
                    </View>
                }
            />

            {/* 画像拡大用モーダル */}
            <Modal
                visible={!!fullscreenImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullscreenImage(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setFullscreenImage(null)}
                >
                    <View style={styles.modalContent}>
                        {fullscreenImage && (
                            <Image
                                source={{ uri: fullscreenImage }}
                                style={styles.fullscreenImage}
                                resizeMode="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setFullscreenImage(null)}
                        >
                            <Ionicons name="close-circle" size={40} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 },
            web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    userId: {
        fontSize: 10,
    },
    date: {
        fontSize: 12,
    },
    contentContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 8,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        padding: 8,
    },
    deleteBtnText: {
        color: '#FF6F61',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    newBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    attachmentPreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#eee',
        position: 'relative',
    },
    attachmentImage: {
        width: '100%',
        height: '100%',
    },
    zoomOverlay: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    closeBtn: {
        position: 'absolute',
        top: -50,
        right: 0,
    },
});
