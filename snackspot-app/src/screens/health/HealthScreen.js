// TAGHRA - Health Screen (Doctors/Vets)
// Browse and search healthcare professionals

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatCurrency, formatDistance } from '../../utils/helpers';

const MOCK_DOCTORS = [
    { id: '1', name: 'Dr. Ahmed Benali', specialty: 'General Medicine', rating: 4.8, reviews: 89, price: 200, distance: 320, available: true },
    { id: '2', name: 'Dr. Fatima Zahra', specialty: 'Pediatrics', rating: 4.9, reviews: 156, price: 250, distance: 450, available: true },
    { id: '3', name: 'Dr. Omar Hassan', specialty: 'Dermatology', rating: 4.6, reviews: 67, price: 300, distance: 800, available: false },
];

const HealthScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('doctors');

    const renderDoctor = ({ item }) => (
        <Card style={styles.doctorCard} onPress={() => navigation.navigate('Booking', { doctorId: item.id })}>
            <View style={styles.doctorHeader}>
                <View style={[styles.doctorAvatar, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="person" size={24} color={colors.info} />
                </View>
                <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.doctorSpecialty, { color: colors.textMuted }]}>{item.specialty}</Text>
                </View>
                <View style={[styles.availableBadge, { backgroundColor: item.available ? colors.successMuted : colors.errorMuted }]}>
                    <Text style={{ color: item.available ? colors.success : colors.error, fontSize: 11, fontWeight: '600' }}>
                        {item.available ? 'Available' : 'Unavailable'}
                    </Text>
                </View>
            </View>
            <View style={styles.doctorMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="star" size={14} color="#FFB84C" />
                    <Text style={[styles.metaText, { color: colors.text }]}>{item.rating} ({item.reviews})</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="location" size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDistance(item.distance)}</Text>
                </View>
                <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(item.price)}</Text>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Health</Text>
                </View>
                <View style={styles.tabs}>
                    {['doctors', 'vets'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons name={tab === 'doctors' ? 'medical' : 'paw'} size={18} color={activeTab === tab ? '#FFF' : colors.textMuted} />
                            <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : colors.textMuted }]}>
                                {tab === 'doctors' ? 'Doctors' : 'Veterinarians'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>
            <FlatList
                data={MOCK_DOCTORS}
                renderItem={renderDoctor}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', gap: 8 },
    tabText: { fontSize: 14, fontWeight: '600' },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    doctorCard: { marginBottom: 12 },
    doctorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    doctorAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    doctorInfo: { flex: 1, marginLeft: 12 },
    doctorName: { fontSize: 16, fontWeight: '700' },
    doctorSpecialty: { fontSize: 13 },
    availableBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    doctorMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 13 },
    price: { marginLeft: 'auto', fontSize: 16, fontWeight: '700' },
});

export default HealthScreen;
