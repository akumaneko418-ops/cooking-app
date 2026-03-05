const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const INITIAL_MASTER_RECIPES = [
    {
        id: '1',
        title: 'フライパン1つで！簡単とろとろオムライス',
        time: '15分',
        imageUrl: '',
        difficultyLevel: 2,
        category: 'western',
        baseServings: 2,
        ingredients: [
            { name: 'ご飯', amount: 300, unit: 'g' },
            { name: '鶏もも肉', amount: 100, unit: 'g' },
            { name: '玉ねぎ', amount: 0.5, unit: '個' },
            { name: 'ケチャップ', amount: 3, unit: '大さじ', gramPerUnit: 15 },
            { name: '卵', amount: 3, unit: '個' },
            { name: '牛乳', amount: 2, unit: '大さじ', gramPerUnit: 15 },
        ],
        steps: [
            '鶏肉と玉ねぎを細かく切る。',
            'フライパンに油をひき、鶏肉と玉ねぎを炒める。',
            'ご飯とケチャップを加えて炒め合わせ、一旦お皿に取り出す。',
            '卵と牛乳を混ぜ、同じフライパンで半熟状に焼く。',
            'チキンライスの上に卵をのせて完成！',
        ],
        isSponsored: true,
    },
    {
        id: '2',
        title: '豚の角煮',
        time: '60分',
        difficultyLevel: 3,
        category: 'japanese',
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: '豚バラブロック', amount: 500, unit: 'g' },
            { name: '大根', amount: 0.5, unit: '本' },
            { name: 'ゆで卵', amount: 4, unit: '個' },
            { name: '醤油', amount: 4, unit: '大さじ' },
            { name: '砂糖', amount: 3, unit: '大さじ' },
            { name: '酒', amount: 50, unit: 'ml' },
        ],
        steps: [
            '豚肉を大きめに切り、表面に焼き色をつける。',
            '大根は厚めの半月切りにする。',
            '鍋に豚肉、大根、調味料を入れ、落とし蓋をして弱火で40分煮る。',
            'ゆで卵を加え、さらに10分煮込んで味を染み込ませる。',
        ]
    },
    {
        id: '3',
        title: '絶品！トマトカレー',
        time: '30分',
        difficultyLevel: 2,
        category: 'western',
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: '鶏もも肉', amount: 300, unit: 'g' },
            { name: '玉ねぎ', amount: 1, unit: '個' },
            { name: 'トマト缶', amount: 1, unit: '缶' },
            { name: 'カレールー', amount: 4, unit: 'かけ' },
            { name: '水', amount: 200, unit: 'ml' },
        ],
        steps: [
            '鶏肉と玉ねぎを一口大に切る。',
            '鍋で鶏肉と玉ねぎを炒める。',
            'トマト缶と水を加え、15分煮込む。',
            '火を止め、カレールーを溶かし入れてさらに5分煮る。',
        ]
    },
    {
        id: '4',
        title: '5分で完成！無限ピーマン',
        time: '5分',
        difficultyLevel: 1,
        category: 'japanese',
        imageUrl: '',
        baseServings: 2,
        ingredients: [
            { name: 'ピーマン', amount: 4, unit: '個' },
            { name: 'ツナ缶', amount: 1, unit: '缶' },
            { name: 'ごま油', amount: 1, unit: '大さじ' },
            { name: '鶏ガラスープの素', amount: 1, unit: '小さじ' },
        ],
        steps: [
            'ピーマンを細切りにする。',
            '耐熱ボウルにピーマン、ツナ（油ごと）、調味料を入れる。',
            'ふんわりラップをして電子レンジ（600W）で3分加熱する。',
            'よく混ぜ合わせ、粗熱が取れたら完成！',
        ]
    },
    {
        id: '5',
        title: '濃厚ビーフシチュー',
        time: '120分',
        difficultyLevel: 3,
        category: 'western',
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: '牛すね肉', amount: 400, unit: 'g' },
            { name: '玉ねぎ', amount: 2, unit: '個' },
            { name: 'にんじん', amount: 1, unit: '本' },
            { name: '赤ワイン', amount: 200, unit: 'ml' },
            { name: 'デミグラスソース缶', amount: 1, unit: '缶' },
        ],
        steps: [
            '牛肉は大きめに切り、塩こしょうをして表面を焼く。',
            '玉ねぎ、にんじんを乱切りにし、鍋で炒める。',
            '牛肉と赤ワインを加え、アルコールを飛ばす。',
            '水とデミグラスソースを加え、弱火で1時間半煮込む。',
        ]
    },
    {
        id: '6',
        title: '本格・麻婆豆腐',
        time: '20分',
        difficultyLevel: 2,
        category: 'chinese',
        imageUrl: '',
        baseServings: 2,
        ingredients: [
            { name: '豆腐', amount: 1, unit: '丁' },
            { name: '豚ひき肉', amount: 150, unit: 'g' },
            { name: '長ネギ', amount: 0.5, unit: '本' },
            { name: '豆板醤', amount: 1, unit: '大さじ' },
            { name: '鶏ガラスープ', amount: 150, unit: 'ml' },
        ],
        steps: [
            '豆腐は1.5cmの角切りにし、ネギをみじん切りにする。',
            'フライパンでひき肉と豆板醤を炒める。',
            'スープと豆腐を加え、5分煮る。',
            '水溶き片栗粉でとろみをつけ、ネギを散らす。',
        ]
    },
    {
        id: '7',
        title: '柔らかチキンシーザー',
        time: '20分',
        difficultyLevel: 2,
        category: 'korean',
        imageUrl: '',
        baseServings: 2,
        ingredients: [
            { name: '鶏もも肉', amount: 300, unit: 'g' },
            { name: 'キャベツ', amount: 0.25, unit: '個' },
            { name: 'コチュジャン', amount: 2, unit: '大さじ' },
            { name: 'ピザ用チーズ', amount: 100, unit: 'g' },
        ],
        steps: [
            '鶏肉と野菜を一口大に切る。',
            'フライパンで具材を炒め、調味料で味付けする。',
            '中央にスペースを空け、チーズを溶かして完成！',
        ]
    },
    {
        id: '8',
        title: 'フルーツティラミス',
        time: '30分',
        difficultyLevel: 2,
        category: 'healthy',
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: 'マスカルポーネ', amount: 200, unit: 'g' },
            { name: 'コーヒー', amount: 100, unit: 'ml' },
            { name: 'ビスケット', amount: 1, unit: '袋' },
            { name: 'フルーツ', amount: 1, unit: '適量' },
        ],
        steps: [
            'コーヒーをビスケットに染み込ませる。',
            'チーズクリームと交互に重ねる。',
            '冷蔵庫で冷やし、フルーツを飾る。',
        ]
    },
];

let sql = '';

const uniqueIngredients = new Map();

// 1. レシピの生成と、ユニークな材料の抽出
for (const r of INITIAL_MASTER_RECIPES) {
    const rId = uuidv4();
    r.uuid = rId;

    sql += `INSERT INTO public.recipes (id, title, description, time_required, difficulty_level, image_url, base_servings, category_id, is_sponsored) VALUES ` +
        `('${rId}', '${r.title}', '', '${r.time}', ${r.difficultyLevel}, '${r.imageUrl || ''}', ${r.baseServings}, '${r.category || ''}', ${r.isSponsored ? 'true' : 'false'});\n`;

    for (const ing of r.ingredients) {
        if (!uniqueIngredients.has(ing.name)) {
            uniqueIngredients.set(ing.name, uuidv4());
        }
    }
}

sql += '\n';

// 2. ユニークな材料の生成
for (const [name, id] of uniqueIngredients.entries()) {
    sql += `INSERT INTO public.ingredients (id, name) VALUES ('${id}', '${name}');\n`;
}

sql += '\n';

// 3. レシピの構成材料と工程の生成
for (const r of INITIAL_MASTER_RECIPES) {
    for (const ing of r.ingredients) {
        const ingId = uniqueIngredients.get(ing.name);
        const riId = uuidv4();
        sql += `INSERT INTO public.recipe_ingredients (id, recipe_id, ingredient_id, amount, unit, gram_per_unit) VALUES ` +
            `('${riId}', '${r.uuid}', '${ingId}', ${ing.amount}, '${ing.unit}', ${ing.gramPerUnit || 'null'});\n`;
    }

    for (let i = 0; i < r.steps.length; i++) {
        const sId = uuidv4();
        sql += `INSERT INTO public.recipe_steps (id, recipe_id, step_number, instruction) VALUES ` +
            `('${sId}', '${r.uuid}', ${i + 1}, '${r.steps[i]}');\n`;
    }
}

fs.writeFileSync('seed.sql', sql);
console.log('generated seed.sql!');
