const fs = require('fs');
const path = require('path');

const distRoot = path.join(__dirname, 'dist');
const assetsDir = path.join(distRoot, 'assets');
const oldNodeModulesDir = path.join(assetsDir, 'node_modules');
const newNodeModulesDir = path.join(assetsDir, 'npm_modules');

console.log('--- Running Netlify Asset Path Fix ---');

// 1. Rename node_modules to npm_modules to prevent Netlify from ignoring the folder during upload
if (fs.existsSync(oldNodeModulesDir)) {
    fs.renameSync(oldNodeModulesDir, newNodeModulesDir);
    console.log('✅ Renamed dist/assets/node_modules to dist/assets/npm_modules');
} else {
    console.log('ℹ️ node_modules directory not found in dist/assets. It may have already been renamed.');
}

// 2. Search and replace 'node_modules' with 'npm_modules' in all bundled JS/HTML/CSS files
function replaceInFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // 再帰的に探索
            replaceInFiles(fullPath);
        } else {
            // JS, CSS, HTMLファイルのみを対象に置換
            if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                // dist配下の相対パス指定として書き出されている node_modules を npm_modules に置換
                if (content.includes('node_modules')) {
                    // 正規表現で安全に置換（assets/node_modules 等のパス指定部分）
                    const newContent = content.replace(/\/node_modules\//g, '/npm_modules/');
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`✅ Updated asset paths in: ${file}`);
                }
            }
        }
    }
}

if (fs.existsSync(distRoot)) {
    replaceInFiles(distRoot);
    console.log('--- Netlify Asset Path Fix Complete ---');
} else {
    console.log('❌ dist folder not found. Please run expo export first.');
}
