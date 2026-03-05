import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, Image, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMasterRecipes, deleteMasterRecipe, MasterRecipe, resetToInitialMasterRecipes, clearAllMyRecipesAndFavorites, getFeedbacks } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { AppButton } from '../components/AppButton';

export default function AdminDashboardScreen({ navigation }: any) {
    const [recipes, setRecipes] = useState<MasterRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedbackCount, setFeedbackCount] = useState(0);
    const { activeTheme, bgTheme } = useTheme();

    const loadRecipes = useCallback(async () => {
        setLoading(true);
        const data = await getMasterRecipes();
        setRecipes(data);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRecipes();
            (async () => {
                const fData = await getFeedbacks();
                setFeedbackCount(fData.length);
            })();
        }, [loadRecipes])
    );

    const handleDelete = (recipe: MasterRecipe) => {
        const msg = `「${recipe.title}」を削除してもよろしいですか？\nこの操作は取り消せません。`;
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) {
                deleteMasterRecipe(recipe.id).then(() => loadRecipes());
            }
        } else {
            Alert.alert(
                "レシピの削除",
                msg,
                [
                    { text: "キャンセル", style: "cancel" },
                    {
                        text: "削除",
                        style: "destructive",
                        onPress: async () => {
                            await deleteMasterRecipe(recipe.id);
                            loadRecipes();
                        }
                    }
                ]
            );
        }
    };

    const handleReset = () => {
        const msg = "マスターデータは初期状態に戻り、今までに保存したマイレシピ・お気に入りはすべて削除されます。よろしいですか？";
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) {
                resetToInitialMasterRecipes()
                    .then(() => clearAllMyRecipesAndFavorites())
                    .then(() => loadRecipes());
            }
        } else {
            Alert.alert(
                "初期化とキャッシュ削除",
                msg,
                [
                    { text: "キャンセル", style: "cancel" },
                    {
                        text: "実行する",
                        style: "destructive",
                        onPress: async () => {
                            await resetToInitialMasterRecipes();
                            await clearAllMyRecipesAndFavorites();
                            loadRecipes();
                        }
                    }
                ]
            );
        }
    };

    const handleNavigateToForm = (recipe?: MasterRecipe) => {
        if (Platform.OS === 'web' && Dimensions.get('window').width > 768) {
            navigation.navigate('AdminDesktopRecipe', { recipe });
        } else {
            navigation.navigate('AdminRecipeForm', { recipe });
        }
    };

    const renderItem = ({ item }: { item: MasterRecipe }) => (
        <View style={[styles.recipeItem, { backgroundColor: bgTheme.surface, borderBottomColor: bgTheme.subText }]}>
            <TouchableOpacity
                onPress={() => handleNavigateToForm(item)}
                style={styles.mainTouchable}
            >
                <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
                <View style={styles.recipeInfo}>
                    <Text style={[styles.recipeTitle, { color: bgTheme.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={[styles.recipeMeta, { color: bgTheme.subText }]}>
                        ID: {item.id} | {item.time} | Lv.{item.difficultyLevel}
                    </Text>
                </View>
                <Ionicons name="create-outline" size={22} color={activeTheme.color} style={{ marginHorizontal: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.actionBtn}
            >
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={bgTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: bgTheme.text }]}>管理者ダッシュボード</Text>
                <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                    <Ionicons name="refresh-outline" size={22} color="#888" />
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <AppButton
                    title="＋ 新規レシピを追加"
                    type="primary"
                    onPress={() => handleNavigateToForm()}
                    style={styles.addBtn}
                />

                <AppButton
                    title={`💬 フィードバックを確認${feedbackCount > 0 ? ` (${feedbackCount > 1000 ? '999+' : feedbackCount > 100 ? '99+' : feedbackCount}件)` : ''}`}
                    type="outline"
                    onPress={() => navigation.navigate('AdminFeedback')}
                    style={styles.feedbackBtn}
                />

                {loading ? (
                    <ActivityIndicator size="large" color={activeTheme.color} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={recipes}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: bgTheme.subText }}>レシピがありません</Text>
                            </View>
                        }
                    />
                )}
            </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    resetBtn: {
        padding: 4,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    addBtn: {
        marginTop: 16,
    },
    feedbackBtn: {
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 40,
    },
    recipeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderBottomWidth: 1,
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    recipeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    mainTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recipeTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    recipeMeta: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
});
