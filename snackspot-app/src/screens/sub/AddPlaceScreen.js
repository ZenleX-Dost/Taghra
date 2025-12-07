// Taghra - Add Place Screen (Sub/Ambassador)
// Form to add new places to the platform

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { CATEGORIES } from '../../utils/constants';

const AddPlaceScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [form, setForm] = useState({
        name: '',
        category: '',
        address: '',
        phone: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);

    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.name || !form.category || !form.address) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success! 🎉', 'Your submission is under review. You\'ll earn 10 points once approved!');
            navigation.goBack();
        }, 1500);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Place</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                        Earn 10 points for each approved submission
                    </Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Input
                    label="Place Name *"
                    placeholder="e.g., Café Marrakech"
                    value={form.name}
                    onChangeText={(v) => updateField('name', v)}
                    leftIcon="business-outline"
                />

                <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
                <View style={styles.categories}>
                    {Object.values(CATEGORIES).map((cat) => (
                        <Card
                            key={cat.id}
                            style={[styles.categoryCard, form.category === cat.id && { borderColor: cat.color, borderWidth: 2 }]}
                            onPress={() => updateField('category', cat.id)}
                        >
                            <Ionicons name={cat.icon} size={24} color={cat.color} />
                            <Text style={[styles.categoryText, { color: colors.text }]}>{cat.label.split(' ')[0]}</Text>
                        </Card>
                    ))}
                </View>

                <Input
                    label="Address *"
                    placeholder="Full address"
                    value={form.address}
                    onChangeText={(v) => updateField('address', v)}
                    leftIcon="location-outline"
                />

                <Input
                    label="Phone Number"
                    placeholder="+212 XXX XXX XXX"
                    value={form.phone}
                    onChangeText={(v) => updateField('phone', v)}
                    leftIcon="call-outline"
                    keyboardType="phone-pad"
                />

                <Input
                    label="Description"
                    placeholder="Brief description of the place"
                    value={form.description}
                    onChangeText={(v) => updateField('description', v)}
                    multiline
                    numberOfLines={3}
                />

                <Button
                    title="Submit for Review"
                    variant="gradient"
                    size="lg"
                    fullWidth
                    loading={loading}
                    onPress={handleSubmit}
                    style={styles.submitButton}
                />
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
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    categoryCard: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
    categoryText: { fontSize: 13, fontWeight: '600' },
    submitButton: { marginTop: 24 },
});

export default AddPlaceScreen;
