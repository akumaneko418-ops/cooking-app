const fs = require('fs');
const path = require('path');

const distRoot = path.join(__dirname, 'dist');
console.log('--- Flattening Font Paths for Netlify ---');

// Finds the deeply nested font, copies it to root, and returns the new absolute URL path
function flattenFontInMatches(content) {
    // This regex looks for any string starting with /assets/ and ending with .ttf
    // It captures both node_modules and npm_modules or any other deep path Expo generated
    const regex = /\/assets\/[^"']+\.ttf/g;

    return content.replace(regex, (match) => {
        const filename = path.basename(match);
        // We know earlier scripts or metro generated the true file inside the local dist dir.
        // Let's figure out where the actual file lives right now.
        const localPath = path.join(distRoot, match.substring(1));
        const destPath = path.join(distRoot, filename);

        // Copy the file to the root of dist if it exists
        if (fs.existsSync(localPath)) {
            fs.copyFileSync(localPath, destPath);
            console.log(`✅ Copied ${filename} to dist root`);
        } else {
            console.log(`⚠️ Font file not found: ${localPath} - It may be already flattened`);
        }

        // Replace in the JS bundle code to simply request the root file
        const newUrl = `/${filename}`;
        console.log(`🔄 URL rewritten: ${match} -> ${newUrl}`);
        return newUrl;
    });
}

function processJsFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processJsFiles(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.match(/\/assets\/[^"']+\.ttf/g)) {
                let newContent = flattenFontInMatches(content);
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`🎯 Updated JS bundle: ${fullPath}`);
            }
        }
    }
}

if (fs.existsSync(distRoot)) {
    processJsFiles(distRoot);
    console.log('--- Flattening Complete ---');
} else {
    console.log('❌ dist folder not found. Please run expo export first.');
}
