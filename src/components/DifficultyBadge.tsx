import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDifficultyData, DIFFICULTY_LEVELS } from '../data/DifficultyLevels';
import { useUIConfig } from '../context/UIConfigContext';

interface DifficultyBadgeProps {
    level: number;
    showDetail?: boolean; // タップで詳細説明を表示するかどうか
    simple?: boolean; // 絵文字のみ（グリッド用）
    labelOnly?: boolean; // 【追加】絵文字＋テキストのみ（コンパクト用）
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ level, showDetail = false, simple = false, labelOnly = false }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { fontSizeScale } = useUIConfig();
    const data = getDifficultyData(level);

    // 難易度に応じてアイコンを繰り返す「アイコン配列表示」
    // 例: Lv3なら icon icon icon（塗り） icon icon（グレー）
    const IconIndicator = ({ color }: { color: string }) => (
        <View style={styles.iconRow}>
            {[1, 2, 3].map((i) => (
                <Ionicons
                    key={i}
                    name="restaurant" // 全レベル共通でナイフとフォークを使用
                    size={14}
                    color={i <= level ? color : '#D0D0D0'} // 達成済みは指定カラー、未達成はグレー
                    style={{ marginHorizontal: 0.5 }}
                />
            ))}
        </View>
    );

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.badge,
                    (!simple || labelOnly) && { backgroundColor: data.lightColor }, // リスト/コンパクト表示時は淡い色
                    simple && !labelOnly && {
                        paddingHorizontal: 0,
                        paddingVertical: 0,
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: data.color, // グリッド表示時は濃い色
                        borderRadius: 12, // 円形を維持
                        borderWidth: 0.8, // 極細の境界線で同化を防止
                        borderColor: 'rgba(0,0,0,0.08)' // 主張しすぎない控えめな色
                    },
                    labelOnly && { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, gap: 4 }
                ]}
                onPress={() => showDetail && setModalVisible(true)}
                activeOpacity={showDetail ? 0.7 : 1}
            >
                {/* simpleモード（3x3グリッド等）では、代表アイコン（絵文字）のみを表示 */}
                {simple && !labelOnly ? (
                    <Text style={{
                        fontSize: 16,
                        includeFontPadding: false,
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        // 一部のOSで絵文字がわずかに上に寄るのを防ぐための補正
                        marginTop: Platform.OS === 'android' ? 0 : 1
                    }}>
                        {data.emoji}
                    </Text>
                ) : (
                    <>
                        <Text style={[styles.emoji, labelOnly && { fontSize: 13 }]}>{data.emoji}</Text>
                        <View style={[styles.textContainer, labelOnly && { gap: 0 }]}>
                            <Text style={[styles.label, { color: data.lightTextColor }, labelOnly && { fontSize: 11 * fontSizeScale }]}>{data.label}</Text>
                            {!labelOnly && <IconIndicator color={data.lightTextColor} />}
                        </View>
                    </>
                )}
            </TouchableOpacity>

            {/* タップで詳細説明をモーダル表示 */}
            {showDetail && (
                <Modal visible={modalVisible} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style={styles.overlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.popup}>
                                    <Text style={styles.popupEmoji}>{data.emoji}</Text>
                                    <Text style={[styles.popupTitle, { color: data.textColor, fontSize: 20 * fontSizeScale }]}>
                                        難易度 {level}：{data.label}
                                    </Text>

                                    {/* ポップアップ内もアイコン表示 */}
                                    <View style={styles.popupIconRow}>
                                        {DIFFICULTY_LEVELS.map((d) => (
                                            <View key={d.level} style={styles.popupIconItem}>
                                                <Ionicons
                                                    name="restaurant" // 全レベル共通
                                                    size={28}
                                                    color={d.level <= level ? data.textColor : '#D0D0D0'}
                                                />
                                                <Text style={[styles.popupIconLabel, { color: d.level <= level ? data.textColor : '#D0D0D0' }]}>
                                                    {d.level}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    <Text style={[styles.popupDesc, { fontSize: 15 * fontSizeScale, lineHeight: 22 * fontSizeScale }]}>{data.description}</Text>
                                    <TouchableOpacity
                                        style={[styles.popupCloseBtn, { backgroundColor: data.textColor }]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.popupCloseBtnText}>閉じる</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 6,
    },
    emoji: {
        fontSize: 16,
    },
    textContainer: {
        gap: 3,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // モーダルのスタイル
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 28,
        width: '85%',
        alignItems: 'center',
        gap: 12,
    },
    popupEmoji: {
        fontSize: 48,
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    popupIconRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 4,
    },
    popupIconItem: {
        alignItems: 'center',
        gap: 2,
    },
    popupIconLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    popupDesc: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 4,
    },
    popupCloseBtn: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 20,
    },
    popupCloseBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
