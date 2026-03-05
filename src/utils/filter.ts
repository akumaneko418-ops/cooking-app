/**
 * 不適切なコンテンツをフィルタリングするための高度なユーティリティ
 */

// 基本的なNGワードリスト
const BASE_NG_WORDS = ['バカ', 'アホ', '死ね', 'まぬけ', 'カス', 'ゴミ', 'クズ', '殺す'];

// 高度なパターン（正規表現）
const ADVANCED_PATTERNS = [
    /[死し][.\s・]*[ねネねえぇ]/, // 死ね、死.ね、しね、シネ、死ねぇ等
    /[殺ころコロ][.\s・]*[すスすぉ]/, // 殺す、殺.す、ころす等
    /[カかｶ][.\s・]*[スすｽ]/,        // カス、カ.ス等
    /([あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん])\1{4,}/, // 同一ひらがなの5回以上の繰り返し
    /(.)\1{9,}/, // 同一文字の10回以上の繰り返し（より広範囲）
];

/**
 * 文字列を正規化する（全角英数→半角、半角カタカナ→全角、大文字→小文字）
 */
const normalizeText = (text: string): string => {
    // 半角カタカナを全角に変換（簡易変換ロジック）
    const kanaMap: { [key: string]: string } = {
        'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
        'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
        'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
        'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
        'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
        'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
        'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
        'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
        'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
        'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
        'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
        'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
        'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
        'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
        'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
        'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
        'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
        'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｰ': 'ー',
    };

    let normalized = text;
    // カナ変換
    const reg = new RegExp(Object.keys(kanaMap).join('|'), 'g');
    normalized = normalized.replace(reg, (match) => kanaMap[match]);

    // 全角英数を半角に、大文字を小文字に
    normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).toLowerCase();

    return normalized;
};

/**
 * 妨害記号（スペース、ドット、各種記号）を除去する
 */
const removeObstacles = (text: string): string => {
    return text.replace(/[.\s・,，、。:：;；*＊_＿\-ー+=＝/／\\＼|｜~～^＾!！?？#＃$＄%％&＆(（)）[［]］{｛}｝<＜>＞@＠"”'’`｀]/g, '');
};

/**
 * 不適切なコンテンツが含まれているか判定する
 */
export const hasInappropriateContent = (text: string): boolean => {
    if (!text) return false;

    // 1. 正規化（全半角統一、小文字化）
    const normalized = normalizeText(text);

    // 2. 記号除去したテキストを作成
    const cleaned = removeObstacles(normalized);

    // 3. 基本NGワードのチェック（記号除去済みテキストに対して）
    const foundBasic = BASE_NG_WORDS.some(word => cleaned.includes(normalizeText(word)));
    if (foundBasic) return true;

    // 4. 正規表現パターンのチェック（正規化済みテキストに対して）
    const foundPattern = ADVANCED_PATTERNS.some(regex => regex.test(normalized));
    if (foundPattern) return true;

    return false;
};
