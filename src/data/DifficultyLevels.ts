// ╔════════════════════════════════════════════════════════╗
// ║  料理難易度マスターデータ                                ║
// ║  このファイルを編集するだけで難易度の定義を変更できます  ║
// ╚════════════════════════════════════════════════════════╝
//
// 【難易度レベルの定義基準】
//   Lv1: 切らない・焼かない。混ぜてレンジ加熱、もう一品感覚
//   Lv2: キッチンばさみで材料をカット・簡単な加熱
//   Lv3: 包丁＋フライパン・鍋。一般的な家庭料理（主婦スタンダード）
//   Lv4: Lv3より少し発展。火加減の調整や下ごしらえが必要
//   Lv5: プロや料理好き向け。専門的な技術・道具が必要

export interface DifficultyLevel {
    level: number;
    label: string;        // 短い名前（バッジ表示用）
    description: string;  // 詳しい説明（タップすると表示）
    icon: string;         // 難易度をひとめで表すアイコン名（Ionicons）
    emoji: string;        // アイコンの補助として使う絵文字
    color: string;        // バッジの背景色（濃いめ・グリッド用）
    lightColor: string;   // バッジの背景色（淡い・リスト用）
    textColor: string;    // バッジの文字色（濃い用）
    lightTextColor: string; // 【新規】バッジの文字色（淡い用）
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
    {
        level: 1,
        label: 'かんたん', // --- 表示名(短い名前) ---
        description: 'お料理初心者向け\n包丁や火を使わないラクチンお料理', // --- 詳しい説明(\nは改行) ---
        icon: 'flash',      // アイコン(Ionicons)
        emoji: '🔰',       // 絵文字
        color: '#A5D6A7',   // より濃いグリーン
        lightColor: '#E8F5E9', // 元の淡いグリーン
        textColor: '#1B5E20', // 濃い背景用の文字色
        lightTextColor: '#2E7D32', // 淡い背景用の文字色
    },
    {
        level: 2,
        label: 'ふつう',
        description: 'ある程度お料理に慣れている人向け\n包丁やフライパンを日常的に使う方に',
        icon: 'restaurant',
        emoji: '🍳',
        color: '#FFCC80',   // より濃いオレンジ
        lightColor: '#FFF3E0', // 元の淡いオレンジ
        textColor: '#E65100',
        lightTextColor: '#E65100', // オレンジは元々共通
    },
    {
        level: 3,
        label: 'チャレンジ',
        description: '少し手間をかけて頑張りたい人向け\n特別な日や本格的なお料理を作りたい時に',
        icon: 'trophy',      // 達成感のあるトロフィーアイコン
        emoji: '👑',       // 冠
        color: '#90CAF9',   // より濃いブルー
        lightColor: '#E3F2FD', // 元の淡いブルー
        textColor: '#0D47A1', // 濃い背景用の文字色
        lightTextColor: '#1565C0', // 淡い背景用の文字色
    },
];

// 難易度ナンバーからデータを取得するヘルパー関数
export const getDifficultyData = (level: number): DifficultyLevel => {
    return DIFFICULTY_LEVELS.find((d) => d.level === level) ?? DIFFICULTY_LEVELS[0];
};
