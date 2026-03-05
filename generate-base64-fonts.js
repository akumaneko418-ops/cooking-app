const fs = require('fs');
const path = require('path');

const ioniconsPath = path.join(__dirname, 'assets', 'fonts', 'Ionicons.ttf');
const materialIconsPath = path.join(__dirname, 'assets', 'fonts', 'MaterialIcons.ttf');

const ioniconsBase64 = fs.readFileSync(ioniconsPath).toString('base64');
const materialIconsBase64 = fs.readFileSync(materialIconsPath).toString('base64');

const tsContent = `// Auto-generated file to bypass Netlify routing issues
export const IoniconsBase64 = "data:font/ttf;charset=utf-8;base64,${ioniconsBase64}";
export const MaterialIconsBase64 = "data:font/ttf;charset=utf-8;base64,${materialIconsBase64}";
`;

fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'fontsBase64.ts'), tsContent);
console.log('Successfully generated src/utils/fontsBase64.ts with embedded font data.');
