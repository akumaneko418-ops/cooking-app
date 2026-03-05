import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Pattern, Circle, Path, Defs, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

export default function BackgroundPattern() {
    const { bgPattern, activeTheme, bgTheme } = useTheme();

    // noneの場合は何も描画しない
    if (bgPattern === 'none') return null;

    // パターンの色はメインカラーを使用し、視認性を高めるため不透明度を 0.25 に設定
    const patternColor = activeTheme.color;
    const patternOpacity = 0.25;
    const subColor = bgTheme.text; // サブの色としてテキスト色を薄く混ぜる

    const renderPattern = () => {
        switch (bgPattern) {
            case 'dots':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="120" height="120">
                        <Circle cx="20" cy="30" r="4" fill={patternColor} opacity={patternOpacity} />
                        <Circle cx="80" cy="20" r="2" fill={patternColor} opacity={patternOpacity * 0.7} />
                        <Circle cx="50" cy="70" r="5" fill={patternColor} opacity={patternOpacity * 0.9} />
                        <Circle cx="100" cy="90" r="3" fill={subColor} opacity={patternOpacity * 0.4} />
                        <Circle cx="30" cy="100" r="2.5" fill={patternColor} opacity={patternOpacity * 0.6} />
                    </Pattern>
                );
            case 'dots2':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="180" height="180">
                        {/* クラスタ1 */}
                        <Circle cx="30" cy="40" r="7" fill={patternColor} opacity={patternOpacity} />
                        <Circle cx="45" cy="35" r="3" fill={subColor} opacity={patternOpacity * 0.5} />
                        <Circle cx="35" cy="55" r="4" fill={patternColor} opacity={patternOpacity * 0.6} />
                        {/* 散布 */}
                        <Circle cx="130" cy="60" r="6" fill={patternColor} opacity={patternOpacity * 0.8} />
                        <Circle cx="90" cy="140" r="8" fill={patternColor} opacity={patternOpacity * 0.7} />
                        <Circle cx="160" cy="150" r="4" fill={subColor} opacity={patternOpacity * 0.4} />
                        <Circle cx="60" cy="120" r="2" fill={patternColor} opacity={patternOpacity} />
                    </Pattern>
                );
            case 'stripes':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="100" height="100">
                        <Path d="M -10 20 L 30 -20 M 10 50 L 60 0 M 40 80 L 90 30 M 70 110 L 120 60" stroke={patternColor} strokeWidth="4" strokeOpacity={patternOpacity} />
                        <Path d="M 0 0 L 100 100" stroke={subColor} strokeWidth="1" strokeOpacity={patternOpacity * 0.2} strokeDasharray="5,5" />
                        <Path d="M 20 0 L 120 100" stroke={patternColor} strokeWidth="1" strokeOpacity={patternOpacity * 0.3} />
                    </Pattern>
                );
            case 'cross':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="150" height="150">
                        <Path d="M 30 20 L 30 40 M 20 30 L 40 30" stroke={patternColor} strokeWidth="3" strokeOpacity={patternOpacity} />
                        <Path d="M 120 40 L 120 60 M 110 50 L 130 50" stroke={patternColor} strokeWidth="2" strokeOpacity={patternOpacity * 0.7} />
                        <Path d="M 60 110 L 60 130 M 50 120 L 70 120" stroke={subColor} strokeWidth="1.5" strokeOpacity={patternOpacity * 0.5} />
                        <Path d="M 10 130 L 10 140 M 5 135 L 15 135" stroke={patternColor} strokeWidth="1" strokeOpacity={patternOpacity * 0.4} />
                    </Pattern>
                );
            case 'wave':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="200" height="100">
                        <Path d="M 0 30 Q 40 0 80 30 T 160 30 T 240 30" fill="none" stroke={patternColor} strokeWidth="3" strokeOpacity={patternOpacity} />
                        <Path d="M -50 60 Q 0 30 50 60 T 150 60 T 250 60" fill="none" stroke={subColor} strokeWidth="1.5" strokeOpacity={patternOpacity * 0.4} />
                        <Path d="M 20 85 Q 70 55 120 85 T 220 85" fill="none" stroke={patternColor} strokeWidth="1" strokeOpacity={patternOpacity * 0.6} />
                    </Pattern>
                );
            case 'zigzag':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="160" height="80">
                        <Path d="M 0 20 L 20 0 L 40 20 L 60 0 L 80 20 L 100 0 L 120 20 L 140 0 L 160 20" fill="none" stroke={patternColor} strokeWidth="3" strokeOpacity={patternOpacity} />
                        <Path d="M 10 50 L 30 30 L 50 50 L 70 30 L 90 50 L 110 30 L 130 50" fill="none" stroke={subColor} strokeWidth="1.5" strokeOpacity={patternOpacity * 0.4} />
                        <Path d="M -20 70 L 10 40 L 40 70 L 70 40 L 100 70 L 130 40 L 160 70" fill="none" stroke={patternColor} strokeWidth="1" strokeOpacity={patternOpacity * 0.5} />
                    </Pattern>
                );
            case 'checkered':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="120" height="120">
                        <Rect x="10" y="10" width="30" height="30" fill={patternColor} opacity={patternOpacity * 0.4} />
                        <Rect x="70" y="20" width="20" height="20" fill={patternColor} opacity={patternOpacity * 0.3} />
                        <Rect x="40" y="70" width="40" height="40" fill={patternColor} opacity={patternOpacity * 0.5} />
                        <Rect x="90" y="80" width="15" height="15" fill={subColor} opacity={patternOpacity * 0.2} />
                    </Pattern>
                );
            case 'stars':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="180" height="180">
                        {/* メインの星 */}
                        <Path d="M40 10 L46 28 L64 28 L50 38 L56 56 L40 45 L24 56 L30 38 L16 28 L34 28 Z" fill={patternColor} opacity={patternOpacity} />
                        {/* 小さな星々 */}
                        <Path d="M120 40 L123 49 L132 49 L125 54 L128 63 L120 58 L112 63 L115 54 L108 49 L117 49 Z" fill={patternColor} opacity={patternOpacity * 0.7} />
                        <Path d="M70 130 L72 136 L78 136 L73 139 L75 145 L70 142 L65 145 L67 139 L62 136 L68 136 Z" fill={subColor} opacity={patternOpacity * 0.5} />
                        <Path d="M150 110 L154 121 L165 121 L156 127 L160 138 L150 131 L140 138 L144 127 L135 121 L146 121 Z" fill={patternColor} opacity={patternOpacity * 0.4} />
                    </Pattern>
                );
            case 'squares':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="140" height="140">
                        <Rect x="20" y="20" width="30" height="30" fill={patternColor} opacity={patternOpacity} />
                        <Rect x="90" y="40" width="20" height="20" stroke={patternColor} strokeWidth="3" strokeOpacity={patternOpacity * 0.8} fill="none" />
                        <Rect x="50" y="90" width="15" height="15" fill={subColor} opacity={patternOpacity * 0.5} />
                        <Rect x="110" y="100" width="10" height="10" stroke={patternColor} strokeWidth="1" strokeOpacity={patternOpacity * 0.6} fill="none" />
                        <Rect x="30" y="110" width="5" height="5" fill={patternColor} opacity={patternOpacity} />
                    </Pattern>
                );
            case 'diamonds':
                return (
                    <Pattern id="bg-pattern" patternUnits="userSpaceOnUse" width="150" height="200">
                        <Path d="M40 20 L70 50 L40 80 L10 50 Z" fill={patternColor} opacity={patternOpacity} />
                        <Path d="M110 60 L130 85 L110 110 L90 85 Z" fill="none" stroke={patternColor} strokeWidth="2" strokeOpacity={patternOpacity * 0.7} />
                        <Path d="M60 140 L80 165 L60 190 L40 165 Z" fill={subColor} opacity={patternOpacity * 0.4} />
                        <Path d="M20 120 L30 135 L20 150 L10 135 Z" fill={patternColor} opacity={patternOpacity * 0.5} />
                    </Pattern>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: -1, pointerEvents: 'none' }]}>
            <Svg width="100%" height="100%">
                <Defs>
                    {renderPattern()}
                </Defs>
                <Rect width="100%" height="100%" fill="url(#bg-pattern)" />
            </Svg>
        </View>
    );
}
