import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { UserLevelProvider } from './src/context/UserLevelContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LayoutProvider, useLayout } from './src/context/LayoutContext';
import { UIConfigProvider, useUIConfig } from './src/context/UIConfigContext';
import { getFeedbacks, getUnreadFeedbackCount } from './src/utils/storage';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import { FavoriteRecipesScreen, EditedRecipesScreen } from './src/screens/MyRecipesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import RecipeEditScreen from './src/screens/RecipeEditScreen';
import SavedRecipeDetailScreen from './src/screens/SavedRecipeDetailScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminRecipeFormScreen from './src/screens/AdminRecipeFormScreen';
import AdminDesktopRecipeScreen from './src/screens/AdminDesktopRecipeScreen';
import AdminFeedbackScreen from './src/screens/AdminFeedbackScreen';
import AuthScreen from './src/screens/AuthScreen';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

// --- カスタムタブバー ---
function CustomTabBar({ state, navigation }: any) {
  const { activeTheme, bgTheme } = useTheme();
  const { fontSizeScale } = useUIConfig();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [feedbackCount, setFeedbackCount] = React.useState(0);

  const isAdmin = !!user;

  const fetchFeedbackCount = React.useCallback(async () => {
    if (!isAdmin) return;
    const count = await getUnreadFeedbackCount();
    setFeedbackCount(count);
  }, [isAdmin]);

  React.useEffect(() => {
    fetchFeedbackCount();
    // 10分ごとに更新を試みる
    const interval = setInterval(fetchFeedbackCount, 600000);
    return () => clearInterval(interval);
  }, [fetchFeedbackCount]);

  const formatBadgeCount = (count: number) => {
    if (count > 1000) return '999+';
    if (count > 100) return '99+';
    return count.toString();
  };

  // 表示する4つのタブ定義
  const tabItems = [
    { name: 'ホーム', label: 'ホーム', icon: (f: boolean, c: string) => <MaterialIcons name={f ? 'home' : 'other-houses'} size={24 * fontSizeScale} color={c} /> },
    { name: '検索', label: '検索', icon: (f: boolean, c: string) => <Ionicons name={f ? 'search' : 'search-outline'} size={24 * fontSizeScale} color={c} /> },
    { name: 'マイレシピ', label: 'マイレシピ', icon: (f: boolean, c: string) => <Ionicons name={f ? 'book' : 'book-outline'} size={24 * fontSizeScale} color={c} /> },
    { name: '設定', label: '設定', icon: (f: boolean, c: string) => <Ionicons name={f ? 'settings' : 'settings-outline'} size={24 * fontSizeScale} color={c} /> },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: bgTheme.surface || '#f5f5f5',
      borderTopWidth: 0.5,
      borderTopColor: (bgTheme.subText || '#999') + '33', // 20% alpha
      height: Platform.OS === 'web' ? 85 * fontSizeScale : (60 * fontSizeScale + insets.bottom),
      paddingBottom: Platform.OS === 'web' ? 10 * fontSizeScale : insets.bottom,
    }}>
      {tabItems.map((item) => {
        // アクティブ状態の判定
        let isFocused = false;
        if (item.name === 'マイレシピ') {
          // 「お気に入り」または「アレンジ」のときマイレシピをハイライト
          isFocused = state.index === 2 || state.index === 3;
        } else if (item.name === 'ホーム') {
          isFocused = state.index === 0;
        } else if (item.name === '検索') {
          isFocused = state.index === 1;
        } else if (item.name === '設定') {
          isFocused = state.index === 4;
        }

        const color = isFocused ? activeTheme.color : bgTheme.subText;

        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => {
              if (item.name === 'マイレシピ') navigation.navigate('お気に入り');
              else navigation.navigate(item.name);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}
          >
            <View>
              {item.icon(isFocused, color)}
              {item.name === '設定' && isAdmin && feedbackCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -10,
                  backgroundColor: '#FF3B30',
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 3,
                  borderWidth: 1.5,
                  borderColor: bgTheme.bg,
                }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>
                    {formatBadgeCount(feedbackCount)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color, fontSize: 10 * fontSizeScale, fontWeight: 'bold', marginTop: 4 * fontSizeScale }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- Themeを適用するためのナビゲーションラップコンポーネント ---
function MainNavigator() {
  const { activeTheme, bgTheme } = useTheme();
  const { layoutType, setLayoutType } = useLayout();
  const { fontSizeScale } = useUIConfig();
  const insets = useSafeAreaInsets();

  // ナビゲーションの状態を監視するためのRef
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const navigationRef = React.useRef<any>(null);

  const isMyRecipes = currentIndex === 2 || currentIndex === 3;

  return (
    <View style={{ flex: 1, backgroundColor: bgTheme.bg }}>
      {/*
        【トップ固定ヘッダー】
        ナビゲーターの外にあるため、スワイプ中も全く動きません。
      */}
      {isMyRecipes && (
        <View style={{
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          backgroundColor: bgTheme.bg,
          borderBottomWidth: 0.5,
          borderBottomColor: bgTheme.surface || '#eee',
        }}>
          <View style={{ flexDirection: 'column', gap: 12 }}>
            {/* タブ切り替え */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: bgTheme.surface || '#f5f5f5',
              borderRadius: 20,
              padding: 4,
            }}>
              <TouchableOpacity
                onPress={() => navigationRef.current?.navigate('お気に入り')}
                style={{
                  flex: 1,
                  paddingVertical: 8 * fontSizeScale,
                  paddingHorizontal: 4,
                  borderRadius: 16 * fontSizeScale,
                  backgroundColor: currentIndex === 2 ? activeTheme.color + 'E6' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: currentIndex === 2 ? '#fff' : bgTheme.subText,
                    fontWeight: 'bold',
                    fontSize: 14 * fontSizeScale,
                  }}>お気に入り</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigationRef.current?.navigate('アレンジ')}
                style={{
                  flex: 1,
                  paddingVertical: 8 * fontSizeScale,
                  paddingHorizontal: 4,
                  borderRadius: 16 * fontSizeScale,
                  backgroundColor: currentIndex === 3 ? activeTheme.color + 'E6' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: currentIndex === 3 ? '#fff' : bgTheme.subText,
                    fontWeight: 'bold',
                    fontSize: 14 * fontSizeScale,
                  }}>アレンジ・自作</Text>
              </TouchableOpacity>
            </View>

            {/* 表示モード切替 */}
            <View style={{ flexDirection: 'row', backgroundColor: bgTheme.surface || '#f5f5f5', borderRadius: 20, padding: 4 }}>
              <TouchableOpacity onPress={() => setLayoutType('list')} style={{ flex: 1, padding: 6 * fontSizeScale, borderRadius: 16, backgroundColor: layoutType === 'list' ? (bgTheme.bg || '#fff') : 'transparent', alignItems: 'center', shadowColor: layoutType === 'list' ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: layoutType === 'list' ? 1 : 0 }}>
                <MaterialIcons name="call-to-action" size={18 * fontSizeScale} color={layoutType === 'list' ? activeTheme.color : bgTheme.subText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLayoutType('grid2')} style={{ flex: 1, padding: 6 * fontSizeScale, borderRadius: 16, backgroundColor: layoutType === 'grid2' ? (bgTheme.bg || '#fff') : 'transparent', alignItems: 'center', shadowColor: layoutType === 'grid2' ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: layoutType === 'grid2' ? 1 : 0 }}>
                <Ionicons name="grid-outline" size={18 * fontSizeScale} color={layoutType === 'grid2' ? activeTheme.color : bgTheme.subText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLayoutType('grid3')} style={{ flex: 1, padding: 6 * fontSizeScale, borderRadius: 16, backgroundColor: layoutType === 'grid3' ? (bgTheme.bg || '#fff') : 'transparent', alignItems: 'center', shadowColor: layoutType === 'grid3' ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: layoutType === 'grid3' ? 1 : 0 }}>
                <Ionicons name="apps-outline" size={18 * fontSizeScale} color={layoutType === 'grid3' ? activeTheme.color : bgTheme.subText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLayoutType('compact')} style={{ flex: 1, padding: 6 * fontSizeScale, borderRadius: 16, backgroundColor: layoutType === 'compact' ? (bgTheme.bg || '#fff') : 'transparent', alignItems: 'center', shadowColor: layoutType === 'compact' ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: layoutType === 'compact' ? 1 : 0 }}>
                <Ionicons name="reorder-four-outline" size={18 * fontSizeScale} color={layoutType === 'compact' ? activeTheme.color : bgTheme.subText} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Tab.Navigator
        tabBarPosition="bottom"
        tabBar={props => {
          // インデックスの同期（少し強引ですが一番確実な方法の一つ）
          navigationRef.current = props.navigation;
          if (props.state.index !== currentIndex) {
            setTimeout(() => setCurrentIndex(props.state.index), 0);
          }
          return <CustomTabBar {...props} />;
        }}
        screenOptions={{
          swipeEnabled: true,
        }}
      >
        <Tab.Screen name="ホーム" component={HomeScreen} />
        <Tab.Screen name="検索" component={SearchScreen} />
        <Tab.Screen name="お気に入り" component={FavoriteRecipesScreen} />
        <Tab.Screen name="アレンジ" component={EditedRecipesScreen} />
        <Tab.Screen name="設定" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === 'web') {
          // Web環境では、Netlifyアップロード制限とExpoのパス生成バグを回避するため、
          // 文字列化(Base64)したフォントデータを直接読み込む（通信を完全に遮断する）
          const { IoniconsBase64, MaterialIconsBase64 } = require('./src/utils/fontsBase64');
          await Font.loadAsync({
            Ionicons: IoniconsBase64,
            MaterialIcons: MaterialIconsBase64
          } as Record<string, Font.FontSource>);
        } else {
          // モバイル環境（iOS/Android）
          await Font.loadAsync({
            ...Ionicons.font,
            ...MaterialIcons.font
          } as Record<string, Font.FontSource>);
        }
      } catch (err) {
        console.warn('Failed to load fonts:', err);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // --- Web特有の100vh見切れ問題を完璧に解決するための動的高さフック ---
  const [windowHeight, setWindowHeight] = React.useState<any>('100%');

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // 初期値セット
      setWindowHeight(window.innerHeight);
      // リサイズ（システムUIの出し入れ）を監視
      const handleResize = () => {
        setWindowHeight(window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LayoutProvider>
          <AuthProvider>
            <UserLevelProvider>
              <UIConfigProvider>
                <NavigationContainer>
                  <RootStack />
                </NavigationContainer>
              </UIConfigProvider>
            </UserLevelProvider>
          </AuthProvider>
        </LayoutProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { activeTheme, bgTheme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerTintColor: activeTheme.color,
        headerStyle: { backgroundColor: bgTheme.bg },
        contentStyle: { backgroundColor: bgTheme.bg }
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'レシピ詳細', headerTitleAlign: 'center', headerBackTitle: '戻る' }}
      />
      <Stack.Screen
        name="RecipeEdit"
        component={RecipeEditScreen}
        options={{ title: 'アレンジ編集', headerTitleAlign: 'center', headerBackTitle: '戻る' }}
      />
      <Stack.Screen name="SavedRecipeDetail" component={SavedRecipeDetailScreen} options={{ title: '保存したレシピ' }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRecipeForm" component={AdminRecipeFormScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminDesktopRecipe" component={AdminDesktopRecipeScreen} options={{ title: 'レシピ管理 (PC)', headerTitleAlign: 'center' }} />
      <Stack.Screen name="AdminFeedback" component={AdminFeedbackScreen} options={{ title: 'フィードバック一覧' }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false, presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
