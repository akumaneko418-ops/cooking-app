import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';

interface SubstitutePopupProps {
    visible: boolean;
    onClose: () => void;
    originalIngredient: string;
    substituteName: string;
    substituteAmount: string;
    affiliateLink?: string;
    onApply?: () => void;
}

export const SubstitutePopup: React.FC<SubstitutePopupProps> = ({
    visible,
    onClose,
    originalIngredient,
    substituteName,
    substituteAmount,
    affiliateLink,
    onApply
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.popup}>
                            <View style={styles.header}>
                                <Ionicons name="bulb-outline" size={24} color="#FFD166" />
                                <Text style={styles.title}>代替食材の提案</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                                    <Ionicons name="close" size={24} color="#999" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.description}>
                                <Text style={styles.highlight}>{originalIngredient}</Text> がない場合は、以下で代用できます。
                            </Text>

                            <View style={styles.substituteBox}>
                                <Text style={styles.substituteName}>{substituteName}</Text>
                                <Text style={styles.substituteAmount}>{substituteAmount}</Text>
                            </View>

                            {onApply && (
                                <View style={styles.applyButtonContainer}>
                                    <AppButton
                                        title="この食材で代用する"
                                        type="primary"
                                        onPress={onApply}
                                    />
                                    <Text style={styles.applyHint}>※栄養価が再計算されます</Text>
                                </View>
                            )}

                            {!!affiliateLink && (
                                <View style={styles.affiliateContainer}>
                                    <Text style={styles.affiliateText}>珍しい調味料ですか？</Text>
                                    <AppButton
                                        title="Amazonで探す"
                                        type="outline"
                                        onPress={() => console.log('Open link:', affiliateLink)}
                                    />
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    closeIcon: {
        padding: 4,
    },
    description: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 16,
    },
    highlight: {
        fontWeight: 'bold',
        color: '#FF6F61',
    },
    substituteBox: {
        backgroundColor: '#FFF1E6',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    substituteName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    substituteAmount: {
        fontSize: 16,
        color: '#666',
    },
    affiliateContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 16,
        alignItems: 'center',
    },
    affiliateText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    applyButtonContainer: {
        marginBottom: 20,
        alignItems: 'center',
        gap: 8,
    },
    applyHint: {
        fontSize: 12,
        color: '#FF6F61',
        fontWeight: 'bold',
    },
});
