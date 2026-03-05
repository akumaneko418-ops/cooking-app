import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, Image, Platform, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { MasterRecipe, getMasterRecipes, saveMasterRecipe, deleteMasterRecipe } from '../utils/storage';
import { RECIPE_CATEGORIES, RECIPE_SUB_CATEGORIES } from '../data/RecipeCategories';
import { DIFFICULTY_LEVELS } from '../data/DifficultyLevels';
import { INGREDIENT_STANDARD } from '../data/IngredientStandardDictionary';
import { AppButton } from '../components/AppButton';
import { RecipeCard } from '../components/RecipeCard';
import { uploadRecipeImageWeb } from '../utils/imageUtils';
import { calculateNutrition } from '../utils/nutritionUtils';

export default function AdminDesktopRecipeScreen({ navigation }: any) {
    const { activeTheme, bgTheme } = useTheme();
    const [recipes, setRecipes] = useState<MasterRecipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<MasterRecipe | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<any>(null);

    // フォーム状態
    const [formState, setFormState] = useState<Partial<MasterRecipe>>({
        title: '',
        time: '',
        imageUrl: '',
        difficultyLevel: 1,
        categories: ['japanese'],
        baseServings: 2,
        ingredients: [{ name: '', amount: 0, unit: '', gramPerUnit: 0 }],
        steps: [''],
    });

    const loadRecipes = useCallback(async () => {
        setLoading(true);
        const data = await getMasterRecipes();
        setRecipes(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadRecipes();
    }, [loadRecipes]);

    const handleSelectRecipe = (recipe: MasterRecipe) => {
        setSelectedRecipe(recipe);
        setFormState(recipe);
    };

    const handleCreateNew = () => {
        setSelectedRecipe(null);
        setFormState({
            title: '',
            time: '',
            imageUrl: '',
            difficultyLevel: 1,
            categories: ['japanese'],
            baseServings: 2,
            ingredients: [{ name: '', amount: 0, unit: '', gramPerUnit: 0 }],
            steps: [''],
        });
    };

    const updateForm = (field: keyof MasterRecipe, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formState.title?.trim()) {
            Alert.alert("エラー", "タイトルを入力してください");
            return;
        }

        try {
            setLoading(true);
            const recipeToSave = {
                ...formState,
                id: formState.id || Date.now().toString(),
                steps: formState.steps?.filter(s => s.trim() !== '') || [],
            } as MasterRecipe;

            await saveMasterRecipe(recipeToSave);
            await loadRecipes();
            setSelectedRecipe(recipeToSave);
            Alert.alert("成功", "レシピを保存しました");
        } catch (error) {
            Alert.alert("エラー", "保存に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            await handleFileUpload(files[0]);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            Alert.alert("エラー", "画像ファイル（jpg, png等）を選択してください");
            return;
        }
        try {
            setUploading(true);
            const url = await uploadRecipeImageWeb(file, formState.id || 'new_recipe');
            if (url) {
                updateForm('imageUrl', url);
            }
        } catch (err) {
            Alert.alert("エラー", "アップロードに失敗しました");
        } finally {
            setUploading(false);
        }
    };

    const onDragOver = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleImportFromUrl = async () => {
        if (!formState.imageUrl || !formState.imageUrl.startsWith('http')) {
            Alert.alert("エラー", "有効な画像URLを入力してください");
            return;
        }

        // すでに Supabase の画像ならスキップ
        if (formState.imageUrl.includes('supabase.co')) {
            Alert.alert("お知らせ", "この画像はすでにアプリのストレージに保存されています");
            return;
        }

        try {
            setUploading(true);
            const response = await fetch(formState.imageUrl);
            const blob = await response.blob();
            const url = await uploadRecipeImageWeb(blob, formState.id || `imported_${Date.now()}`);
            if (url) {
                updateForm('imageUrl', url);
                Alert.alert("成功", "画像をアプリ専用ストレージに取り込みました。これで元画像が消えても大丈夫です！");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("エラー", "画像の取り込みに失敗しました。セキュリティ上の制限（CORS）が原因の可能性があります。画像を一度保存してから、下の「ファイルを選択」でアップロードしてください。");
        } finally {
            setUploading(false);
        }
    };

    const filteredRecipes = recipes.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View
            // @ts-ignore - Web-specific props
            onDragOver={onDragOver}
            onDragEnter={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={[styles.container, { backgroundColor: bgTheme.bg }]}
        >
            {isDragging && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: activeTheme.color + '22', zIndex: 9999, pointerEvents: 'none', borderStyle: 'dashed', borderWidth: 4, borderColor: activeTheme.color, margin: 8, borderRadius: 16 }]} />
            )}
            {/* サイドバー: レシピ一覧 */}
            <View style={[styles.sidebar, { backgroundColor: bgTheme.surface, borderRightColor: bgTheme.subText + '33' }]}>
                <View style={styles.sidebarHeader}>
                    <View>
                        <Text style={[styles.sidebarTitle, { color: bgTheme.text }]}>レシピ管理</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Main')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 8,
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                                backgroundColor: activeTheme.color + '15',
                                borderRadius: 6,
                                alignSelf: 'flex-start'
                            }}
                        >
                            <Ionicons name="arrow-back" size={18} color={activeTheme.color} />
                            <Text style={{ fontSize: 14, color: activeTheme.color, marginLeft: 6, fontWeight: 'bold' }}>アプリに戻る</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleCreateNew} style={[styles.createNewBtn, { backgroundColor: activeTheme.color }]}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.createNewBtnText}>新規作成</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={bgTheme.subText} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: bgTheme.text, backgroundColor: bgTheme.bg }]}
                        placeholder="レシピを検索..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <ScrollView style={styles.recipeList}>
                    {filteredRecipes.map(recipe => (
                        <TouchableOpacity
                            key={recipe.id}
                            style={[
                                styles.recipeListItem,
                                selectedRecipe?.id === recipe.id && { backgroundColor: activeTheme.color + '15', borderLeftColor: activeTheme.color }
                            ]}
                            onPress={() => handleSelectRecipe(recipe)}
                        >
                            <Text style={[styles.recipeItemTitle, { color: bgTheme.text }]} numberOfLines={1}>{recipe.title}</Text>
                            <Text style={[styles.recipeItemSub, { color: bgTheme.subText }]}>
                                {recipe.time} / {recipe.categories.map(catId => RECIPE_CATEGORIES.find(c => c.id === catId)?.label || catId).join(', ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* メインエリア: 編集フォーム */}
            <View style={styles.mainContent}>
                <ScrollView contentContainerStyle={styles.formScroll}>
                    <View style={styles.formHeader}>
                        <Text style={[styles.formTitle, { color: bgTheme.text }]}>
                            {selectedRecipe ? 'レシピを編集' : '新規レシピ登録'}
                        </Text>
                        <AppButton
                            title="反映・保存する"
                            type="primary"
                            onPress={handleSave}
                            style={styles.saveBtn}
                            loading={loading}
                        />
                    </View>

                    <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                            <Text style={[styles.label, { color: bgTheme.text }]}>タイトル</Text>
                            <TextInput
                                style={[styles.input, { color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                value={formState.title}
                                onChangeText={v => updateForm('title', v)}
                                placeholder="タイトルを入力"
                            />
                        </View>
                        <View style={styles.gridCol}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                                <Text style={[styles.label, { color: bgTheme.text, marginBottom: 0 }]}>画像URL</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {formState.imageUrl && !formState.imageUrl.includes('supabase.co') && (
                                        <TouchableOpacity
                                            onPress={handleImportFromUrl}
                                            style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: '#2ecc7122', borderWidth: 1, borderColor: '#2ecc71' }}
                                        >
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#27ae60' }}>ストレージに保存</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => fileInputRef.current?.click()}
                                        style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: activeTheme.color, borderWidth: 1, borderColor: activeTheme.color }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>ファイルを選択...</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TextInput
                                style={[styles.input, { color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                value={formState.imageUrl}
                                onChangeText={v => updateForm('imageUrl', v)}
                                placeholder="https://... または画像をドロップ"
                            />
                            {uploading && (
                                <Text style={{ fontSize: 11, color: activeTheme.color, marginTop: 4 }}>画像をアップロード中...</Text>
                            )}
                            {/* 隠しインプット */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e: any) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file);
                                }}
                            />
                        </View>
                    </View>

                    <View style={styles.gridRow}>
                        <View style={styles.gridColSmall}>
                            <Text style={[styles.label, { color: bgTheme.text }]}>時間</Text>
                            <TextInput
                                style={[styles.input, { color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                value={formState.time}
                                onChangeText={v => updateForm('time', v)}
                                placeholder="15分"
                            />
                        </View>
                        <View style={styles.gridColSmall}>
                            <Text style={[styles.label, { color: bgTheme.text }]}>人数分</Text>
                            <TextInput
                                style={[styles.input, { color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                value={formState.baseServings?.toString()}
                                onChangeText={v => updateForm('baseServings', parseInt(v) || 0)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.gridCol}>
                            <Text style={[styles.label, { color: bgTheme.text }]}>難易度</Text>
                            <View style={styles.diffRow}>
                                {DIFFICULTY_LEVELS.map(level => (
                                    <TouchableOpacity
                                        key={level.level}
                                        onPress={() => updateForm('difficultyLevel', level.level)}
                                        style={[
                                            styles.diffChip,
                                            formState.difficultyLevel === level.level && { backgroundColor: level.color }
                                        ]}
                                    >
                                        <Text style={[styles.diffChipText, formState.difficultyLevel === level.level && { color: '#fff' }]}>{level.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                            <Text style={[styles.label, { color: bgTheme.text }]}>カテゴリ設定</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {RECIPE_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                                    const isSelected = formState.categories?.includes(cat.id);
                                    return (
                                        <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => {
                                                const current = formState.categories || [];
                                                if (isSelected) {
                                                    updateForm('categories', current.filter(c => c !== cat.id));
                                                } else {
                                                    updateForm('categories', [...current, cat.id]);
                                                }
                                            }}
                                            style={[
                                                styles.catChip,
                                                isSelected && { backgroundColor: activeTheme.color, borderColor: activeTheme.color }
                                            ]}
                                        >
                                            <Text style={[styles.catChipText, isSelected && { color: '#fff' }]}>{cat.emoji} {cat.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                            <Text style={[styles.label, { color: bgTheme.text }]}>サブジャンル</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {RECIPE_SUB_CATEGORIES.map(cat => {
                                    const isSelected = formState.categories?.includes(cat.id);
                                    return (
                                        <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => {
                                                const current = formState.categories || [];
                                                if (isSelected) {
                                                    updateForm('categories', current.filter(c => c !== cat.id));
                                                } else {
                                                    updateForm('categories', [...current, cat.id]);
                                                }
                                            }}
                                            style={[
                                                styles.catChip,
                                                { borderColor: '#7C5CFC44' },
                                                isSelected && { backgroundColor: '#7C5CFC', borderColor: '#7C5CFC' }
                                            ]}
                                        >
                                            <Text style={[styles.catChipText, isSelected && { color: '#fff' }]}>{cat.emoji} {cat.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={styles.multiColumnSection}>
                        <View style={[styles.formColumn, { minWidth: 400 }]}>
                            <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>材料リスト</Text>
                            {formState.ingredients?.map((ing, idx) => (
                                <View key={idx} style={styles.listItemRow}>
                                    <TextInput
                                        style={[styles.listInput, { flex: 3, color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                        value={ing.name}
                                        placeholder="名称"
                                        onChangeText={v => {
                                            const next = [...(formState.ingredients || [])];
                                            next[idx].name = v;
                                            updateForm('ingredients', next);
                                        }}
                                    />
                                    {ing.name.trim() !== '' && !INGREDIENT_STANDARD[ing.name.trim()] && (
                                        <View style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10 }}>
                                            <Text style={{ fontSize: 9, color: '#FF3B30', fontWeight: 'bold', backgroundColor: '#fff', paddingHorizontal: 4 }}>
                                                ※食材データなし
                                            </Text>
                                        </View>
                                    )}
                                    <TextInput
                                        style={[styles.listInput, { minWidth: 60, flex: 1, color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                        value={(!ing.amount || ing.amount === '0') ? '' : String(ing.amount)}
                                        placeholder="量"
                                        onChangeText={v => {
                                            const next = [...(formState.ingredients || [])];

                                            // 全角スラッシュを半角に変換し、数値・ピリオド・半角スラッシュのみを許可
                                            let val = v.replace(/／/g, '/').replace(/[^0-9./]/g, '');

                                            // 純粋な数値としてパース可能かチェック（スラッシュが含まれていない場合）
                                            const isPureNumeric = /^[0-9.]+$/.test(val);
                                            const num = isPureNumeric ? parseFloat(val) : NaN;

                                            let finalAmount: number | string = val;

                                            if (val !== '' && isPureNumeric && !isNaN(num) && num > 0) {
                                                // 単位が空の場合、デフォルトで 'g' を設定
                                                if (!next[idx].unit) {
                                                    next[idx].unit = 'g';
                                                }
                                                // 1000以上の場合は kg に変換
                                                if (num >= 1000) {
                                                    finalAmount = num / 1000;
                                                    next[idx].unit = 'kg';
                                                }
                                            }

                                            next[idx].amount = finalAmount === '' ? '' : finalAmount;
                                            updateForm('ingredients', next);
                                        }}
                                    />
                                    <TextInput
                                        style={[styles.listInput, { flex: 1.2, minWidth: 70, color: bgTheme.text, backgroundColor: bgTheme.surface }]}
                                        value={ing.unit}
                                        placeholder="単位"
                                        onChangeText={v => {
                                            const next = [...(formState.ingredients || [])];
                                            next[idx].unit = v;
                                            updateForm('ingredients', next);
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => {
                                            const next = formState.ingredients?.filter((_, i) => i !== idx);
                                            updateForm('ingredients', next);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={[styles.addItemBtn, { borderColor: activeTheme.color }]}
                                onPress={() => updateForm('ingredients', [...(formState.ingredients || []), { name: '', amount: '', unit: '', gramPerUnit: 0 }])}
                            >
                                <Ionicons name="add" size={18} color={activeTheme.color} />
                                <Text style={{ color: activeTheme.color, fontWeight: 'bold' }}>材料を追加</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.formColumn, { minWidth: 400 }]}>
                            <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>作り方の手順</Text>
                            {formState.steps?.map((step, idx) => (
                                <View key={idx} style={styles.listItemRow}>
                                    <Text style={[styles.stepNum, { color: activeTheme.color, backgroundColor: activeTheme.color + '22' }]}>{idx + 1}</Text>
                                    <TextInput
                                        style={[styles.listInput, { flex: 1, color: bgTheme.text, backgroundColor: bgTheme.surface, minHeight: 60, textAlignVertical: 'top' }]}
                                        value={step}
                                        multiline
                                        placeholder="手順の内容..."
                                        onChangeText={v => {
                                            const next = [...(formState.steps || [])];
                                            next[idx] = v;
                                            updateForm('steps', next);
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => {
                                            const next = formState.steps?.filter((_, i) => i !== idx);
                                            updateForm('steps', next);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={[styles.addItemBtn, { borderColor: activeTheme.color }]}
                                onPress={() => updateForm('steps', [...(formState.steps || []), ''])}
                            >
                                <Ionicons name="add" size={18} color={activeTheme.color} />
                                <Text style={{ color: activeTheme.color, fontWeight: 'bold' }}>手順を追加</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* 右カラム: リアルタイムプレビュー */}
            <View style={[styles.previewColumn, { backgroundColor: bgTheme.bg, borderLeftColor: bgTheme.subText + '33' }]}>
                <View style={styles.previewHeader}>
                    <Text style={[styles.previewHeaderTitle, { color: bgTheme.text }]}>リアルタイムプレビュー</Text>
                </View>
                <ScrollView contentContainerStyle={styles.previewScroll}>
                    <View style={styles.previewWrapper}>
                        {/* ドラッグ＆ドロップターゲットの役割を兼ねるプレビューエリア */}
                        <View
                            // @ts-ignore
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            style={[
                                styles.dropZone,
                                isDragging && { borderColor: activeTheme.color, backgroundColor: activeTheme.color + '11' }
                            ]}
                        >
                            <RecipeCard
                                title={formState.title || '（タイトル未入力）'}
                                time={formState.time || '0分'}
                                imageUrl={formState.imageUrl || ''}
                                difficultyLevel={formState.difficultyLevel || 1}
                                categories={formState.categories || []}
                                calories={calculateNutrition(formState.ingredients || [], formState.baseServings || 2).calories}
                                onPress={() => { }}
                            />
                            {uploading && (
                                <View style={styles.uploadOverlay}>
                                    <ActivityIndicator color={activeTheme.color} size="large" />
                                    <Text style={{ marginTop: 12, color: activeTheme.color, fontWeight: 'bold' }}>アップロード中...</Text>
                                </View>
                            )}
                            {!formState.imageUrl && !uploading && (
                                <View style={styles.dropZoneHint}>
                                    <Ionicons name="cloud-upload-outline" size={32} color={bgTheme.subText} />
                                    <Text style={{ color: bgTheme.subText, fontSize: 12, marginTop: 8 }}>ここに画像をドロップ</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ marginTop: 24, padding: 16, backgroundColor: bgTheme.surface, borderRadius: 12, width: '100%' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: bgTheme.text, marginBottom: 8 }}>詳細画面の構成確認</Text>
                            <Text style={{ color: bgTheme.subText, fontSize: 13 }}>【材料】{formState.ingredients?.length}点</Text>
                            <Text style={{ color: bgTheme.subText, fontSize: 13 }}>【手順】{formState.steps?.length}ステップ</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 320,
        borderRightWidth: 1,
    },
    sidebarHeader: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sidebarTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    createNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    createNewBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        position: 'relative',
    },
    searchIcon: {
        position: 'absolute',
        left: 28,
        top: 10,
        zIndex: 1,
    },
    searchInput: {
        paddingVertical: 8,
        paddingLeft: 40,
        paddingRight: 16,
        borderRadius: 8,
        fontSize: 14,
    },
    recipeList: {
        flex: 1,
    },
    recipeListItem: {
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    recipeItemTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    recipeItemSub: {
        fontSize: 11,
    },
    mainContent: {
        flex: 1,
    },
    formScroll: {
        padding: 32,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    saveBtn: {
        width: 200,
        height: 48,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 24,
    },
    gridCol: {
        flex: 1,
    },
    gridColSmall: {
        width: 120,
    },
    label: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    diffRow: {
        flexDirection: 'row',
        gap: 8,
    },
    diffChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    diffChipText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    multiColumnSection: {
        flexDirection: 'row',
        gap: 48,
        marginTop: 16,
        flexWrap: 'wrap',
    },
    formColumn: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    listItemRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    listInput: {
        padding: 10,
        borderRadius: 8,
        fontSize: 14,
    },
    removeBtn: {
        padding: 8,
    },
    addItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 12,
        gap: 8,
    },
    stepNum: {
        width: 28,
        height: 28,
        borderRadius: 14,
        textAlign: 'center',
        lineHeight: 28,
        fontSize: 13,
        fontWeight: 'bold',
    },
    previewColumn: {
        width: 400,
        borderLeftWidth: 1,
    },
    previewHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    previewHeaderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    previewScroll: {
        padding: 24,
    },
    previewWrapper: {
        alignItems: 'center',
    },
    dropZone: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        borderStyle: 'dashed',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dropZoneHint: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
    uploadOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
    },
    catChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    catChipText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    }
});
