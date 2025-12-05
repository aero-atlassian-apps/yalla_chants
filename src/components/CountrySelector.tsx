import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { useCountries } from '../hooks/useChants';
import { useGuestStore } from '../store/guestStore';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';

interface CountrySelectorProps {
    visible: boolean;
    onClose: () => void;
    onCountrySelect: (countryId: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
    visible,
    onClose,
    onCountrySelect,
}) => {
    const { t } = useTranslation();
    const Colors = useColors();
    const { countries, loading } = useCountries();
    const { selectedCountryId, setSelectedCountryId } = useGuestStore();
    const { setPrimaryColor, setDefaultColor } = useThemeStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (country.name_arabic && country.name_arabic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (country.name_french && country.name_french.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleCountrySelect = (country: any) => {
        setSelectedCountryId(country.id);
        if (country.theme_primary_color) {
            setPrimaryColor(country.theme_primary_color);
        } else {
            setDefaultColor();
        }
        onCountrySelect(country.id);
        onClose();
    };

    const renderCountryItem = ({ item }: { item: any }) => {
        const isSelected = selectedCountryId === item.id;
        const themeColor = item.theme_primary_color || Colors.primary;

        return (
            <TouchableOpacity
                style={[
                    styles.countryItem,
                    { backgroundColor: Colors.surface },
                    isSelected && { borderColor: themeColor, borderWidth: 2 }
                ]}
                onPress={() => handleCountrySelect(item)}
            >
                <View style={styles.countryInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 40, height: 30, marginRight: 10 }}>
                            <SvgUri
                                width="100%"
                                height="100%"
                                uri={item.flag_svg_url}
                            />
                        </View>
                        <Text style={[styles.countryName, { color: Colors.text }]}>
                            {item.name}
                        </Text>
                    </View>
                    {item.theme_primary_color && (
                        <View style={styles.themeOptions}>
                            <TouchableOpacity style={styles.themeOption} onPress={() => setPrimaryColor(item.theme_primary_color)}>
                                <View style={[styles.themeColorDot, { backgroundColor: item.theme_primary_color }]} />
                                <Text style={[styles.themeColorText, { color: Colors.textSecondary }]}>
                                    {t('countrySelector.themeColor')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.themeOption} onPress={setDefaultColor}>
                                <View style={[styles.themeColorDot, { backgroundColor: '#1DB954' }]} />
                                <Text style={[styles.themeColorText, { color: Colors.textSecondary }]}>
                                    {t('countrySelector.defaultColor')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={themeColor} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={[Colors.background, Colors.backgroundAlt]}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: Colors.text }]}>
                        {t('countrySelector.title')}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={[styles.searchContainer, { backgroundColor: Colors.surfaceLight }]}>
                    <Ionicons name="search" size={20} color={Colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: Colors.text }]}
                        placeholder={t('countrySelector.searchPlaceholder')}
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <FlatList
                    data={filteredCountries}
                    renderItem={renderCountryItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                <View style={[styles.footer, { backgroundColor: Colors.surface }]}>
                    <Text style={[styles.footerText, { color: Colors.textSecondary }]}>
                        {t('countrySelector.footerText')}
                    </Text>
                </View>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    countryInfo: {
        flex: 1,
    },
    countryName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    themeOptions: {
        flexDirection: 'row',
        marginTop: 8,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    themeColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    themeColorText: {
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});