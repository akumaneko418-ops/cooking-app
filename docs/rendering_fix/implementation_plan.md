# 実装計画: レンダリングエラーと表示不具合の修正

## 課題の概要
React Native (Fabric 時代) における厳密なレンダリングルールにより発生していたエラー、およびスタイル指定の誤りによる「画像が表示されない」問題を解消します。

## 主な修正内容

### 1. 描画エラーの防止 (Text strings must be rendered within a <Text> component)
- **原因**: 
    - 1. `{condition && <Component />}` の `condition` が `""` (空文字) や `0` だった場合、それ自体が文字列として描画されようとし、`<Text>` 外でエラーになる。
    - 2. JSXタグの直後に不必要な空白（スペース2つなど）が存在し、React Native がそれを文字ノードとして扱おうとした。
- **対策**:
    - すべての条件式を `!!condition` でブーリアン化。
    - タグ間の不要な空白を削除。

### 2. 画像表示の不備修正
- **原因**: 
    - `style={[styles.base, condition && styles.extra]}` のような形式で、`condition` が `false` の場合に `false` という値がスタイル配列に含まれ、一部の環境やFabricレンダラーでスタイルの適用を阻害していた。
- **対策**:
    - `style={[styles.base, condition ? styles.extra : null]}` のように、三項演算子で `null` を渡す形式に統一。

## 修正対象ファイル
- [RecipeDetailScreen.tsx](file:///c:/Users/akuma/画像生成用/output/cooking-app/app/src/screens/RecipeDetailScreen.tsx)
- [HomeScreen.tsx](file:///c:/Users/akuma/画像生成用/output/cooking-app/app/src/screens/HomeScreen.tsx)
- [RecipeCard.tsx](file:///c:/Users/akuma/画像生成用/output/cooking-app/app/src/components/RecipeCard.tsx)
- [SavedRecipeDetailScreen.tsx](file:///c:/Users/akuma/画像生成用/output/cooking-app/app/src/screens/SavedRecipeDetailScreen.tsx)

## 検証計画
- アプリを再起動し、以下の箇所でエラーが出ないこと、および画像が表示されることを確認。
    - ホーム画面のレシピカード
    - デザイン性の高い「栄養成分表示」カードを画面に追加。
- 詳細栄養素（糖質、塩分等）を優先度に基づき、視認性の高いテーブル形式に変更。
- 材料リストに、対象のアレルゲンが含まれる場合にアイコン（警告マーク等）を表示。
    - レシピ詳細画面のトップ画像
    - 画像未設定レシピのプレースホルダー（お皿のアイコン）
