# 実装計画: 背景パターンの追加とバグ修正 (完了報告)

## 追加実装の要件
1. **背景パターンの追加** (完了)
   - ドット、ストライプ、グリッド、クロス、ウェーブ など6種類の背景パターンを追加（`react-native-svg` 利用）
   - 設定画面（SettingsScreen）へのUI追加
   - ThemeContextの拡張と永続化処理

2. **追加修正要件** (完了)
   - **管理者ダッシュボードのゴミ箱ボタンの不具合解消**
     - 現状：ローカルのキャッシュは消えるが、Supabase側が消えていなかった。
     - 対策：`storage.ts` の `deleteMasterRecipe` に、クラウド（データベース）上の `recipes`, `recipe_steps`, `recipe_ingredients` から完全削除するSQL呼び出しを追加。
   - **非アクティブ時のタブアイコン崩れの修正**
     - 現状：Web版において `Ionicons` の `-outline` フォントが正常に描画されず、アイコンが消えて文字のみが下部に表示されていた。
     - 対策：`App.tsx` 内の `tabBarIcon` ロジックで、`-outline` バリアントを使わず、すべて塗りつぶしアイコンに統一し、色のみ（activeTheme色 vs #999）で選択状態を区別するよう変更。これによりWeb版でもレイアウトが安定。

## 実施した変更ファイル
- `app/package.json` (`react-native-svg` の追加)
- `app/src/context/ThemeContext.tsx`
- `app/src/components/BackgroundPattern.tsx` (新規作成)
- `app/src/screens/HomeScreen.tsx`
- `app/src/screens/SearchScreen.tsx`
- `app/src/screens/MyRecipesScreen.tsx`
- `app/src/screens/RecipeDetailScreen.tsx`
- `app/src/screens/SettingsScreen.tsx`
- `app/src/utils/storage.ts` (削除ロジックの修正)
- `app/App.tsx` (タブアイコン描画の修正)

## ビルド手順
すべてのコード修正後、アプリの最終ビルド（Web出力）を実行しました。
```bash
npx expo export -p web
```
`dist/` フォルダの内容を再度Netlify （またはデプロイサービス）にアップロードすることで最新版が公開されます。
