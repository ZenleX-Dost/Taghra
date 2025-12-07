// Taghra - Admin Screen (Documents Guide)
// Search and find administrative documents

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

const POPULAR_DOCS = [
    { id: '1', name: 'Carte Nationale', icon: 'card', desc: 'Identity card procedures' },
    { id: '2', name: 'Extrait de Naissance', icon: 'document-text', desc: 'Birth certificate' },
    { id: '3', name: 'Passeport', icon: 'airplane', desc: 'Passport application' },
    { id: '4', name: 'Permis de Conduire', icon: 'car', desc: 'Driving license' },
];

const AdminScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Documents</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                        Find what you need for any procedure
                    </Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Input
                    placeholder="Search for a document..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon="search"
                    style={styles.searchInput}
                />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Documents</Text>
                <View style={styles.docsGrid}>
                    {POPULAR_DOCS.map((doc) => (
                        <Card
                            key={doc.id}
                            style={styles.docCard}
                            onPress={() => navigation.navigate('AdministrationDetail', { docId: doc.id })}
                        >
                            <View style={[styles.docIcon, { backgroundColor: colors.admin + '20' }]}>
                                <Ionicons name={doc.icon} size={28} color={colors.admin} />
                            </View>
                            <Text style={[styles.docName, { color: colors.text }]}>{doc.name}</Text>
                            <Text style={[styles.docDesc, { color: colors.textMuted }]}>{doc.desc}</Text>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 14, marginTop: 4 },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    searchInput: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    docCard: { width: '48%', alignItems: 'center', paddingVertical: 20 },
    docIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    docName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    docDesc: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});

export default AdminScreen;
