// 料理の「切り方」解説辞書
// 新しい切り方を追加したい場合は、ここに1エントリ追加するだけでアプリ全体に反映されます。

export interface CuttingTechniqueData {
    name: string;         // 切り方の名称
    size: string;         // 目安サイズ（例: 1〜2mm角）
    description: string;  // わかりやすい説明文
    tip: string;          // コツ・ポイント
    imageUrl: string;     // 参考画像のURL（フリー素材など）
}

// ※ キーはレシピの「作り方テキスト」と完全一致させてください
export const CUTTING_DICTIONARY: Record<string, CuttingTechniqueData> = {

    'みじん切り': {
        name: 'みじん切り',
        size: '1〜3mm角（米粒より少し大きい程度）',
        description: 'とても細かく刻む切り方。炒め物やソースに混ぜ込む時に使います。',
        tip: '玉ねぎは縦に細かく切り込みを入れてから横に切ると素早くできます。',
        imageUrl: 'https://picsum.photos/400/200?random=1',
    },

    '薄切り': {
        name: '薄切り',
        size: '1〜3mm厚（コイン程度の薄さ）',
        description: '食材を薄くスライスする切り方。炒め物や煮物の火通りが良くなります。',
        tip: '食材を少し冷凍して半解凍状態にすると、均等に薄く切りやすいです。',
        imageUrl: 'https://picsum.photos/400/200?random=2',
    },

    '乱切り': {
        name: '乱切り',
        size: '2〜3cm程度（親指第一関節くらい）',
        description: '食材を転がしながら斜めに切る方法。断面が多くなり味が染み込みやすくなります。',
        tip: '煮物やカレーによく使います。大きさをなるべく揃えると火の通りが均一になります。',
        imageUrl: 'https://picsum.photos/400/200?random=3',
    },

    'ざく切り': {
        name: 'ざく切り',
        size: '3〜5cm角（親指の長さくらい）',
        description: '葉物野菜などを大きめに切る方法。食感が残り、炒め物や鍋料理に向いています。',
        tip: 'あまり細かくなりすぎないよう、豪快に大きめに切るのがコツです。',
        imageUrl: 'https://picsum.photos/400/200?random=4',
    },

    '千切り': {
        name: '千切り',
        size: '幅1〜2mm × 長さ4〜5cm（マッチ棒くらい）',
        description: '細長く糸のように切る方法。炒め物や和え物、サラダに使います。',
        tip: '薄切りにしてから重ねてまとめて切ると、均一に仕上がります。',
        imageUrl: 'https://picsum.photos/400/200?random=5',
    },

    '半月切り': {
        name: '半月切り',
        size: '厚さ5mm〜1cm（小指の爪くらいの厚さ）',
        description: '丸い食材を縦半分に切ってから薄く切る方法。大根やにんじんによく使います。',
        tip: '断面が半円（半月形）になるのが特徴です。',
        imageUrl: 'https://picsum.photos/400/200?random=6',
    },

    /* 💡 新しい切り方はここに追加できます
     * '角切り': {
     *   name: '角切り',
     *   size: '1〜2cm角（サイコロ状）',
     *   description: '...',
     *   tip: '...',
     *   imageAscii: '...',
     * },
     */
};
