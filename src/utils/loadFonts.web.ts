// Ionicons用のフォントファイルを直接WebのDOMに追加する処理
const IoniconsFont = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');

const iconFontStyles = `
@font-face {
  src: url(${IoniconsFont});
  font-family: 'Ionicons';
}
`;

export default function loadFonts() {
    if (typeof document === 'undefined') return;

    // すでにstyleが追加されている場合はスキップ
    if (document.getElementById('expo-ionicons-font')) return;

    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'expo-ionicons-font';
    if ((style as any).styleSheet) { // IE8 etc
        (style as any).styleSheet.cssText = iconFontStyles;
    } else {
        style.appendChild(document.createTextNode(iconFontStyles));
    }
    document.head.appendChild(style);
}
