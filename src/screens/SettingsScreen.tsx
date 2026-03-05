import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    Switch, TouchableOpacity, LayoutAnimation, UIManager, Platform,
    Modal, ScrollView as HScrollView, Alert, TextInput,
    Image, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserLevel } from '../context/UserLevelContext';
import { useTheme, THEME_COLORS, BG_THEMES, BgPatternId } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DIFFICULTY_LEVELS } from '../data/DifficultyLevels';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { useUIConfig } from '../context/UIConfigContext';
import BackgroundPattern from '../components/BackgroundPattern';
import { saveFeedback, getLastFeedbackTime, getFeedbacks, getUnreadFeedbackCount } from '../utils/storage';
import { hasInappropriateContent } from '../utils/filter';
import { pickImageFromLibrary, uploadFeedbackImage } from '../utils/imageUtils';

// AndroidでのLayoutAnimation有効化（New Architectureでは不要なため削除）

export default function SettingsScreen({ navigation }: any) {
    const { userLevel, setUserLevel, filterEnabled, setFilterEnabled } = useUserLevel();
    const { activeTheme, setTheme, setCustomColor, customColor, bgTheme, setBgTheme, bgPattern, setBgPattern } = useTheme();
    const { user, signOut, updateNickname } = useAuth();
    const {
        fontSizeScale, setFontSizeScale,
        resetConfig
    } = useUIConfig();
    const scrollRef = React.useRef<ScrollView>(null);

    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState(user?.user_metadata?.display_name || '');
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const formatCount = (count: number) => {
        if (count > 1000) return '999+';
        if (count > 100) return '99+';
        return count.toString();
    };

    const loadFeedbackCount = useCallback(async () => {
        const count = await getUnreadFeedbackCount();
        setFeedbackCount(count);
    }, []);

    const handlePickImage = async () => {
        const uri = await pickImageFromLibrary();
        if (uri) {
            setSelectedImage(uri);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
    };


    useFocusEffect(
        useCallback(() => {
            loadFeedbackCount();
        }, [loadFeedbackCount])
    );

    const handleSendFeedback = async () => {
        if (!feedbackText.trim()) {
            Alert.alert('入力エラー', 'フィードバック内容を入力してください');
            return;
        }

        // 高度な不適切コンテンツフィルタリング
        if (hasInappropriateContent(feedbackText)) {
            Alert.alert('送信エラー', '内容が不適切、または無意味な文字列である可能性があります');
            return;
        }

        /* 一時的に制限解除
        // 連続送信制限チェック (3分 = 180,000ms)
        const lastTime = await getLastFeedbackTime();
        const now = Date.now();
        if (now - lastTime < 180000) {
            const waitMin = Math.ceil((180000 - (now - lastTime)) / 60000);
            Alert.alert('送信制限', `連続での送信は制限されています。あと約${waitMin}分お待ちください。`);
            return;
        }
        */

        try {
            setIsUploading(true);
            let attachmentUrl = undefined;

            if (selectedImage) {
                const uploadedUrl = await uploadFeedbackImage(selectedImage, user?.id || 'anonymous');
                if (uploadedUrl) {
                    attachmentUrl = uploadedUrl;
                } else {
                    Alert.alert('警告', '画像のアップロードに失敗しました。文章のみ送信しますか？', [
                        { text: 'キャンセル', onPress: () => { setIsUploading(false); return; }, style: 'cancel' },
                        { text: '送信する', onPress: () => { /* continue */ } }
                    ]);
                    // もしキャンセルされた場合の中断処理が必要だが、シンプルにするため続行
                    if (!attachmentUrl && !confirm('画像のアップロードに失敗しました。文章のみ送信しますか？')) {
                        setIsUploading(false);
                        return;
                    }
                }
            }

            await saveFeedback(
                feedbackText.trim(),
                user?.id || 'anonymous',
                user?.user_metadata?.display_name || 'ゲスト',
                attachmentUrl
            );
            Alert.alert('完了', 'ご意見ありがとうございます！');
            setFeedbackText('');
            setSelectedImage(null);
        } catch (error) {
            Alert.alert('エラー', '送信に失敗しました。時間をおいて再度お試しください。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateNickname = async () => {
        if (!newNickname.trim() || newNickname.length > 10) {
            Alert.alert('エラー', 'ニックネームは10文字以内で入力してください');
            return;
        }
        const error = await updateNickname(newNickname.trim());
        if (error) {
            Alert.alert('エラー', error);
        } else {
            setIsEditingNickname(false);
            Alert.alert('完了', 'ニックネームを更新しました');
        }
    };
    // どのセクションが開いているかを管理（nullなら全部閉じている）
    const [expandedSection, setExpandedSection] = useState<'level' | 'color' | 'ui' | 'feedback' | null>(null);
    // カスタムカラーピッカーモーダルの状態
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [previewColor, setPreviewColor] = useState(customColor ?? '#FF6F61');

    // 設定タブにフォーカスするたびの処理（以前はリセットしていたが、維持するように変更）
    useFocusEffect(
        useCallback(() => {
            // 必要があればここでの初期化処理を追加
            return () => {
                // 画面を離れる際の後処理があれば
            };
        }, [])
    );

    // 管理者判定: 今回はログインしていれば管理者と判定する
    const isAdmin = !!user;


    const toggleSection = (section: 'level' | 'color' | 'ui') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSection(expandedSection === section ? null : section);
    };

    const PATTERNS: { id: BgPatternId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
        { id: 'none', label: 'なし', icon: 'square-outline' },
        { id: 'dots', label: 'ドット', icon: 'ellipse' },
        { id: 'dots2', label: 'ドット2', icon: 'radio-button-on' },
        { id: 'stripes', label: '斜線', icon: 'barcode' },
        { id: 'cross', label: 'クロス', icon: 'add' },
        { id: 'wave', label: 'ウェーブ', icon: 'water' },
        { id: 'zigzag', label: 'ジグザグ', icon: 'trending-up' },
        { id: 'checkered', label: 'チェッカー', icon: 'apps' },
        { id: 'stars', label: 'スター', icon: 'star' },
        { id: 'squares', label: 'スクエア', icon: 'square' },
        { id: 'diamonds', label: 'ダイヤ', icon: 'diamond' },
    ];

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <BackgroundPattern />
            {/* 全体スクロール */}
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={[styles.container, { flexGrow: 1 }]}
            >

                {/* アカウントセクション */}
                <View style={[styles.section, { marginBottom: 8 }]}>
                    {user ? (
                        <View style={{ padding: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <Ionicons name="person-circle-outline" size={48} color={activeTheme.color} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    {isEditingNickname ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <TextInput
                                                style={[styles.nicknameInput, { color: bgTheme.text, borderColor: activeTheme.color }]}
                                                value={newNickname}
                                                onChangeText={setNewNickname}
                                                autoFocus
                                                maxLength={10}
                                            />
                                            <TouchableOpacity onPress={handleUpdateNickname}>
                                                <Ionicons name="checkmark-circle" size={28} color={activeTheme.color} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setIsEditingNickname(false)}>
                                                <Ionicons name="close-circle" size={28} color={bgTheme.subText} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={[styles.sectionTitle, { marginBottom: 2 }]} numberOfLines={1}>
                                                    {user.user_metadata?.display_name || '名称未設定'}
                                                </Text>
                                                <Text style={{ color: bgTheme.subText, fontSize: 13 }} numberOfLines={1}>{user.email}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.editBtn, { backgroundColor: activeTheme.color + '10' }]}
                                                onPress={() => {
                                                    setNewNickname(user.user_metadata?.display_name || '');
                                                    setIsEditingNickname(true);
                                                }}
                                            >
                                                <Text style={{ color: activeTheme.color, fontSize: 12, fontWeight: 'bold' }}>編集</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.authBtn, { borderColor: '#e74c3c' }]}
                                onPress={() => Alert.alert('ログアウト', 'ログアウトしますか？', [
                                    { text: 'キャンセル', style: 'cancel' },
                                    { text: 'ログアウト', style: 'destructive', onPress: signOut }
                                ])}
                            >
                                <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                                <Text style={[styles.authBtnText, { color: '#e74c3c' }]}>ログアウト</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ padding: 16 }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>👤 アカウント</Text>
                            <Text style={{ color: bgTheme.subText, fontSize: 13, marginBottom: 12 }}>
                                ログインするとお気に入りを複数端末で同期できます。
                            </Text>
                            <TouchableOpacity
                                style={[styles.authBtn, { borderColor: activeTheme.color }]}
                                onPress={() => navigation.navigate('Auth')}
                            >
                                <Ionicons name="log-in-outline" size={18} color={activeTheme.color} />
                                <Text style={[styles.authBtnText, { color: activeTheme.color }]}>ログイン / 新規登録</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── 料理レベル・フィルター設定 (アコーディオン) ── */}
                <View style={[styles.section, expandedSection === 'level' && styles.sectionExpanded]}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('level')}
                        activeOpacity={0.7}
                    >
                        {/* セクションの見出し文字を変更したい場合はここを編集 */}
                        <Text style={styles.sectionTitle}>🍽️ あなたの料理レベル</Text>
                        <Ionicons
                            name={expandedSection === 'level' ? "chevron-up" : "chevron-down"}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection === 'level' && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionDesc}>
                                設定したレベルに合ったレシピを優先的に表示します
                            </Text>

                            {DIFFICULTY_LEVELS.map((d) => {
                                const isSelected = userLevel === d.level;
                                return (
                                    <TouchableOpacity
                                        key={d.level}
                                        style={[
                                            styles.levelCard,
                                            isSelected && { borderColor: d.lightTextColor, borderWidth: 2, backgroundColor: d.lightColor },
                                        ]}
                                        onPress={() => setUserLevel(d.level)}
                                    >
                                        <View style={styles.levelLeft}>
                                            <Text style={styles.levelEmoji}>{d.emoji}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.levelLabel, isSelected && { color: d.lightTextColor }]}>
                                                    Lv.{d.level} {d.label}
                                                </Text>
                                                <Text style={styles.levelDesc}>{d.description}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.levelIconRow}>
                                            {[1, 2, 3].map((i) => (
                                                <Ionicons
                                                    key={i}
                                                    name="restaurant" // 全レベル共通でナイフとフォークを使用
                                                    size={18}
                                                    color={i <= d.level ? d.lightTextColor : '#D0D0D0'}
                                                    style={{ marginHorizontal: 1 }}
                                                />
                                            ))}
                                        </View>
                                        {isSelected && (
                                            <View style={[styles.selectedBadge, { backgroundColor: d.lightTextColor }]}>
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                            {/* フィルター設定もここに内包 */}
                            <View style={styles.filterRow}>
                                <View style={styles.filterLeft}>
                                    <Text style={styles.filterTitle}>あなたのレベルに合うレシピだけ表示</Text>
                                    <Text style={styles.filterDesc}>
                                        ONにすると、設定したレベル以下のレシピのみ表示されます
                                    </Text>
                                </View>
                                <Switch
                                    value={filterEnabled}
                                    onValueChange={setFilterEnabled}
                                    trackColor={{ false: '#ddd', true: activeTheme.color }}
                                    thumbColor={filterEnabled ? '#fff' : '#fff'}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* ── デザイン・テーマ設定（カラー・パターンを統合） (アコーディオン) ── */}
                <View style={[styles.section, expandedSection === 'color' && styles.sectionExpanded]}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('color')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>🎨 デザイン・テーマ設定</Text>
                        <Ionicons
                            name={expandedSection === 'color' ? "chevron-up" : "chevron-down"}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection === 'color' && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.colorSubLabel}>📌 アクセントカラー</Text>
                            <Text style={styles.sectionDesc}>ボタンやアイコンなどの強調色を変更できます</Text>

                            <View style={styles.colorPalette}>
                                {Object.values(THEME_COLORS).map((theme) => {
                                    const isActive = activeTheme.id === theme.id;
                                    return (
                                        <TouchableOpacity
                                            key={theme.id}
                                            style={[
                                                styles.colorButton,
                                                { backgroundColor: theme.color },
                                                isActive && styles.colorButtonActive
                                            ]}
                                            onPress={() => setTheme(theme.id as any)}
                                            activeOpacity={0.8}
                                        >
                                            {isActive && (
                                                <Ionicons name="checkmark" size={30} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* カスタムカラーボタン（パステルドット＋ラベル） */}
                                <View style={styles.customColorWrapper}>
                                    <TouchableOpacity
                                        style={[
                                            styles.colorButton,
                                            styles.customColorButton,
                                            activeTheme.isCustom && {
                                                borderWidth: 3,
                                                borderColor: activeTheme.color,
                                                transform: [{ scale: 1.1 }],
                                            }
                                        ]}
                                        onPress={() => {
                                            setPreviewColor(customColor ?? activeTheme.color);
                                            setColorPickerVisible(true);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {activeTheme.isCustom ? (
                                            /* 選択済み：選んだ色で塗りつぶし */
                                            <View style={[styles.customSelectedFill, { backgroundColor: activeTheme.color }]}>
                                                <Ionicons name="checkmark" size={20} color="#fff" />
                                            </View>
                                        ) : (
                                            /* 未選択：3×3カラーグリッド */
                                            <View style={styles.colorMiniGrid}>
                                                {[
                                                    '#FF6B7A', '#FFB347', '#C97AE0',
                                                    '#5ECBA1', '#F06292', '#4FC3E8',
                                                    '#7B9CF5', '#FF9F4A', '#F7D44C',
                                                ].map((c, i) => (
                                                    <View key={i} style={[styles.colorMiniCell, { backgroundColor: c }]} />
                                                ))}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <Text style={styles.customColorLabel}>カスタム</Text>
                                </View>
                            </View>

                            <Text style={styles.currentColorText}>
                                現在: <Text style={{ color: activeTheme.color, fontWeight: 'bold' }}>{activeTheme.name}</Text>
                            </Text>

                            <View style={styles.colorSectionDivider} />

                            {/* ―― 背景カラー ―― */}
                            <Text style={styles.colorSubLabel}>📌 背景カラー</Text>
                            <Text style={styles.sectionDesc}>アプリの背景色を切り替えます</Text>
                            <View style={styles.bgThemeContainer}>
                                {Object.values(BG_THEMES).map((theme) => {
                                    const isActive = bgTheme.id === theme.id;
                                    return (
                                        <TouchableOpacity
                                            key={theme.id}
                                            style={[
                                                styles.bgThemeBtn,
                                                { backgroundColor: theme.surface },
                                                isActive && { borderColor: activeTheme.color, borderWidth: 2 }
                                            ]}
                                            onPress={() => setBgTheme(theme.id as any)}
                                        >
                                            <View style={[styles.bgThemeSample, { backgroundColor: theme.bg }]} />
                                            <Text style={[styles.bgThemeText, { color: theme.text }]}>{theme.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.colorSectionDivider} />

                            {/* ―― 背景パターン ―― */}
                            <Text style={styles.colorSubLabel}>🔲 背景パターン</Text>
                            <Text style={styles.sectionDesc}>背景にさりげない柄を追加できます</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 10 }}>
                                {PATTERNS.map((pattern) => {
                                    const isActive = bgPattern === pattern.id;
                                    return (
                                        <TouchableOpacity
                                            key={pattern.id}
                                            style={[
                                                styles.bgPatternBtn,
                                                { backgroundColor: bgTheme.surface },
                                                isActive && { borderColor: activeTheme.color, borderWidth: 2 }
                                            ]}
                                            onPress={() => setBgPattern(pattern.id)}
                                        >
                                            <Ionicons name={pattern.icon} size={24} color={isActive ? activeTheme.color : bgTheme.subText} />
                                            <Text style={[styles.bgThemeText, { color: isActive ? activeTheme.color : bgTheme.text, marginTop: 4 }]}>
                                                {pattern.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>

                {/* ── カスタムカラーピッカーモーダル ── */}
                <Modal
                    visible={colorPickerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setColorPickerVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setColorPickerVisible(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
                            <Text style={styles.modalTitle}>🎨 カスタムカラー</Text>
                            <Text style={styles.modalDesc}>色をタップして選択してください</Text>

                            {/* プレビュー */}
                            <View style={[styles.colorPreviewBox, { backgroundColor: previewColor }]}>
                                <Text style={styles.colorPreviewText}>選択中の色</Text>
                            </View>

                            {/* カラーグリッド */}
                            <HScrollView
                                style={{ maxHeight: 220 }}
                                showsVerticalScrollIndicator={false}
                            >
                                {[
                                    // 赤系
                                    ['#FF1744', '#FF6F61', '#FF7043', '#FF8A65', '#FFAB91'],
                                    // ピンク・マゼンタ系
                                    ['#E91E63', '#EC407A', '#F06292', '#AB47BC', '#CE93D8'],
                                    // パープル・インディゴ系
                                    ['#7E57C2', '#9C27B0', '#5C6BC0', '#3F51B5', '#7986CB'],
                                    // ブルー系
                                    ['#1E88E5', '#42A5F5', '#29B6F6', '#26C6DA', '#80DEEA'],
                                    // グリーン系
                                    ['#26A69A', '#4CAF50', '#66BB6A', '#9CCC65', '#D4E157'],
                                    // 黄色・オレンジ系
                                    ['#FFCA28', '#FFA726', '#FF7043', '#795548', '#8D6E63'],
                                    // グレー系
                                    ['#78909C', '#90A4AE', '#B0BEC5', '#546E7A', '#37474F'],
                                ].map((row, rowIdx) => (
                                    <View key={rowIdx} style={styles.colorGridRow}>
                                        {row.map((c) => (
                                            <TouchableOpacity
                                                key={c}
                                                style={[
                                                    styles.colorGridBtn,
                                                    { backgroundColor: c },
                                                    previewColor === c && styles.colorGridBtnActive
                                                ]}
                                                onPress={() => setPreviewColor(c)}
                                            >
                                                {previewColor === c && (
                                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </HScrollView>

                            {/* ボタン行 */}
                            <View style={styles.modalButtonRow}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setColorPickerVisible(false)}
                                >
                                    <Text style={styles.modalCancelText}>キャンセル</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalApplyBtn, { backgroundColor: previewColor }]}
                                    onPress={() => {
                                        setCustomColor(previewColor);
                                        setColorPickerVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalApplyText}>この色を使う</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>


                {/* ── UIカスタマイズ設定 (アコーディオン) ── */}
                <View style={[styles.section, expandedSection === 'ui' && styles.sectionExpanded]}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('ui')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>⚙️ 表示サイズの変更</Text>
                        <Ionicons
                            name={expandedSection === 'ui' ? "chevron-up" : "chevron-down"}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection === 'ui' && (
                        <View style={styles.sectionContent}>
                            {/* 文字サイズ設定 */}
                            <Text style={styles.colorSubLabel}>🔤 アプリ全体の大きさ</Text>
                            <Text style={styles.sectionDesc}>文字だけでなく、アイコンや余白などのサイズも調整されます</Text>
                            <View style={styles.uiSegmentedContainer}>
                                {[
                                    { label: '標準', scale: 1.0 },
                                    { label: '中', scale: 1.15 },
                                    { label: '大', scale: 1.3 },
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.scale}
                                        style={[
                                            styles.uiSegmentedBtn,
                                            fontSizeScale === item.scale && { backgroundColor: activeTheme.color + 'E6' }
                                        ]}
                                        onPress={() => setFontSizeScale(item.scale)}
                                    >
                                        <Text style={[
                                            styles.uiSegmentedText,
                                            fontSizeScale === item.scale && { color: '#fff' }
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* 視覚的サンプル表示 */}
                            <View style={[styles.uiFontSizeSample, { backgroundColor: activeTheme.color + '08', borderColor: activeTheme.color + '20', padding: 12 * fontSizeScale }]}>
                                <Text style={[styles.uiFontSizeSampleLabel, { color: activeTheme.color, fontSize: 13 * fontSizeScale }]}>表示サイズのサンプル</Text>
                                <View style={[styles.uiFontSizeSampleContent, { padding: 16 * fontSizeScale }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 * fontSizeScale }}>
                                        <Ionicons name="restaurant" size={24 * fontSizeScale} color={activeTheme.color} style={{ marginRight: 8 * fontSizeScale }} />
                                        <Text style={[styles.uiFontSizeSampleText, { fontSize: 16 * fontSizeScale, color: bgTheme.text }]}>
                                            おいしい料理の作り方
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 13 * fontSizeScale, color: bgTheme.subText, marginTop: 4 * fontSizeScale }}>
                                        文字やアイコン、余白の大きさが変化します。
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── プレビュー（常に表示） ── */}
                <View style={styles.previewContainer}>
                    <Text style={styles.previewTitle}>📋 現在の設定内容</Text>
                    <View style={styles.previewCard}>
                        <Text style={styles.previewLabel}>あなたのレベル：</Text>
                        <DifficultyBadge level={userLevel} showDetail />
                        <Text style={[styles.previewFilter, { color: filterEnabled ? activeTheme.color : '#999' }]}>
                            フィルター: {filterEnabled ? 'ON（絞り込み中）' : 'OFF（全件表示）'}
                        </Text>
                    </View>
                </View>



                {/* 管理者ダッシュボードへの入り口 */}
                {isAdmin && (
                    <View style={[styles.section, { marginTop: 32 }]}>
                        <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
                            <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>🔧 管理者ツール</Text>
                            {feedbackCount > 0 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3015', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', marginRight: 6 }} />
                                    <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>新着あり ({formatCount(feedbackCount)}件)</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.sectionContent}>
                            <TouchableOpacity
                                style={[styles.adminBtn, { backgroundColor: activeTheme.color }]}
                                onPress={() => navigation.navigate('AdminDashboard')}
                            >
                                <Ionicons name="settings-sharp" size={24} color="#fff" />
                                <Text style={styles.adminBtnText}>レシピ管理ダッシュボードを開く</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 下部余白 */}
                <View style={{ height: 24 }} />

                {/* ── フィードバックセクション (アコーディオン) ── */}
                {!user ? (
                    <View style={[styles.section, { backgroundColor: bgTheme.surface + '80', borderStyle: 'dashed', borderWidth: 1, borderColor: activeTheme.color + '40' }]}>
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Ionicons name="lock-closed-outline" size={32} color={bgTheme.subText} />
                            <Text style={{ color: bgTheme.text, marginTop: 8, textAlign: 'center' }}>
                                フィードバックを送るにはログインが必要です
                            </Text>
                            <TouchableOpacity
                                style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: activeTheme.color, borderRadius: 20 }}
                                onPress={() => navigation.navigate('Auth')}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>ログイン / 新規登録</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.feedbackSectionOuter, expandedSection === 'feedback' && styles.sectionExpanded]}>
                        <View style={styles.feedbackSectionInner}>
                            <TouchableOpacity
                                style={[styles.sectionHeader, { backgroundColor: '#FF5252', justifyContent: 'center' }]}
                                onPress={() => toggleSection('feedback' as any)}
                                activeOpacity={0.8}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                                    <Text style={[styles.sectionTitle, { color: '#fff', fontWeight: 'bold' }]}>フィードバックを送る</Text>
                                </View>
                                <Ionicons
                                    name={expandedSection === 'feedback' ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>

                            {expandedSection === 'feedback' && (
                                <View style={[styles.sectionContent, { paddingTop: 16 }]}>
                                    <Text style={styles.sectionDesc}>
                                        アプリへのご意見・ご要望をお聞かせください。
                                    </Text>
                                    <TextInput
                                        style={[styles.feedbackInput, { color: bgTheme.text, backgroundColor: bgTheme.surface, borderColor: activeTheme.color + '20' }]}
                                        placeholder="不具合、要望、使い心地などお気軽にご入力ください..."
                                        placeholderTextColor={bgTheme.subText}
                                        multiline
                                        numberOfLines={4}
                                        value={feedbackText}
                                        onChangeText={setFeedbackText}
                                        textAlignVertical="top"
                                    />

                                    <View style={styles.attachmentArea}>
                                        {selectedImage ? (
                                            <View style={styles.imagePreviewWrapper}>
                                                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                                                <TouchableOpacity
                                                    style={styles.removeImageBtn}
                                                    onPress={handleRemoveImage}
                                                >
                                                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.attachBtn, { borderColor: activeTheme.color + '40' }]}
                                                onPress={handlePickImage}
                                            >
                                                <Ionicons name="image-outline" size={24} color={activeTheme.color} />
                                                <Text style={[styles.attachBtnText, { color: activeTheme.color }]}>画像を添付</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.feedbackSendBtn,
                                            { backgroundColor: activeTheme.color },
                                            (isUploading || !feedbackText.trim()) && { opacity: 0.6 }
                                        ]}
                                        onPress={handleSendFeedback}
                                        disabled={isUploading || !feedbackText.trim()}
                                        activeOpacity={0.8}
                                    >
                                        {isUploading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Ionicons name="send" size={18} color="#fff" />
                                        )}
                                        <Text style={styles.feedbackSendBtnText}>
                                            {isUploading ? '送信中...' : '送信する'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* バージョン情報等 */}
                <View style={[styles.versionContainer, !isAdmin && { marginTop: 24 }]}>
                    <View style={styles.versionTouchable}>
                        <Text style={[styles.versionText, { color: bgTheme.subText }]}>Version 1.0.0</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    container: {
        padding: 16,
        paddingBottom: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                overflow: 'hidden',
            },
            android: {
                elevation: 2,
                // overflow: 'hidden' をAndroidで使うとelevationと組み合わせで子頚の背景色が白わきになるバグがあるため除外
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                overflow: 'hidden',
            },
        }),
    },
    sectionExpanded: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    sectionDesc: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
        lineHeight: 18,
    },
    levelCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 12,
        marginBottom: 10,
        gap: 8,
        position: 'relative',
    },
    levelLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        flex: 1,
    },
    levelEmoji: { fontSize: 24, marginTop: 2 },
    levelLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    levelDesc: { fontSize: 12, color: '#666', lineHeight: 19 },
    levelIconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    selectedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    filterLeft: { flex: 1 },
    filterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    filterDesc: { fontSize: 12, color: '#666', lineHeight: 17 },
    // 背景テーマ設定用
    bgThemeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    bgThemeBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    bgThemeSample: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    bgThemeText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    // 【新設】画像添付関連のスタイル
    attachmentArea: {
        marginVertical: 12,
    },
    attachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    attachBtnText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    imagePreviewWrapper: {
        width: 120,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#eee',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    previewContainer: {
        marginTop: 8,
        paddingHorizontal: 8,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    previewCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        gap: 10,
        marginTop: 8,
        alignItems: 'flex-start',
    },
    previewLabel: { fontSize: 14, color: '#555' },
    previewFilter: { fontSize: 14, fontWeight: 'bold' },
    colorPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
        justifyContent: 'center',
    },
    colorButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    colorButtonActive: {
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
    },
    currentColorText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
        marginTop: 8,
    },
    customColorButton: {
        borderWidth: 2,
        borderColor: '#C8A0E8',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    customColorWrapper: {
        alignItems: 'center',
    },
    customColorLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 3,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    rainbowStripes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
    rainbowSlice: { flex: 1 },
    rainbowPlusIcon: { position: 'absolute', alignSelf: 'center' },
    customSelectedFill: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customDotContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    pastelDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        opacity: 0.85,
    },
    customDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    colorMiniGrid: {
        width: 36,
        height: 36,
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 6,
        overflow: 'hidden',
    },
    colorMiniCell: {
        width: 12,
        height: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    modalDesc: {
        fontSize: 13,
        color: '#888',
        marginBottom: 16,
        textAlign: 'center',
    },
    colorPreviewBox: {
        height: 72,
        borderRadius: 16,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    colorPreviewText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    hexInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    hexHash: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555',
        marginRight: 4,
    },
    hexInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        paddingVertical: 12,
        letterSpacing: 3,
    },
    quickPaletteLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    quickPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    quickColorBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    quickColorBtnActive: {
        borderWidth: 3,
        borderColor: '#333',
        transform: [{ scale: 1.15 }],
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        color: '#666',
        fontWeight: 'bold',
    },
    modalApplyBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
            android: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
            web: { boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }
        }),
    },
    modalApplyText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: 'bold',
    },
    colorSubLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555',
        marginTop: 4,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    colorSectionDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    colorGridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    colorGridBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    colorGridBtnActive: {
        borderWidth: 3,
        borderColor: '#fff',
        transform: [{ scale: 1.15 }],
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
            android: { borderWidth: 3, borderColor: '#fff' },
            web: { boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }
        }),
    },
    adminBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    adminBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    passcodeModal: {
        width: '80%',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    passcodeInput: {
        width: '60%',
        height: 60,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottomWidth: 2,
        marginBottom: 24,
        letterSpacing: 10,
    },
    versionContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    versionTouchable: {
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    versionText: {
        fontSize: 12,
        letterSpacing: 1,
        opacity: 0.7,
    },
    authBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        gap: 6,
    },
    authBtnText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    nicknameInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    editBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    bgPatternBtn: {
        width: 72,
        height: 72,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
            android: { borderWidth: 1, borderColor: '#eee' },
            web: { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
        }),
    },
    uiSegmentedContainer: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    uiSegmentedBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uiSegmentedText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    resetBtn: {
        marginTop: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    resetBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    uiFontSizeSample: {
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    uiFontSizeSampleLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        opacity: 0.8,
    },
    uiFontSizeSampleContent: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    uiFontSizeSampleText: {
        lineHeight: 24,
        textAlign: 'center',
    },
    feedbackInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        minHeight: 100,
        fontSize: 16,
        marginTop: 8,
    },
    feedbackSendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    feedbackSendBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Androidで elevation + overflow:hidden の組み合わせを避けるための二層構造
    feedbackSectionOuter: {
        borderRadius: 12,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    feedbackSectionInner: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
});

