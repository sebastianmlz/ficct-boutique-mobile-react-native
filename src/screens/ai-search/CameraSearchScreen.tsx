import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { searchSimilarImages, type SimilarityResult } from '@/services/ai/ai.service';

type Nav = NavigationProp<{ SimilarResults: { results: SimilarityResult[]; preview: string } }>;

export function CameraSearchScreen() {
  const navigation = useNavigation<Nav>();
  const [picked, setPicked] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);

  const pickFromCamera = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Active la cámara para usar esta función.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) setPicked(result.assets[0]);
  };

  const pickFromGallery = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Active la galería para usar esta función.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) setPicked(result.assets[0]);
  };

  const search = async (): Promise<void> => {
    if (!picked) return;
    setBusy(true);
    try {
      const ext = picked.uri.split('.').pop() || 'jpg';
      const results = await searchSimilarImages({
        uri: picked.uri,
        name: `query.${ext}`,
        type: picked.mimeType ?? 'image/jpeg',
      });
      navigation.navigate('SimilarResults', { results, preview: picked.uri });
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar por imagen</Text>
      <Text style={styles.subtitle}>Tome una foto de una prenda o suba una imagen, y encontraremos artículos similares en nuestra boutique.</Text>

      <View style={styles.preview}>
        {picked ? (
          <Image source={{ uri: picked.uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>Sin imagen seleccionada</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.action} onPress={pickFromCamera}>
          <Text style={styles.actionText}>📷 Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={pickFromGallery}>
          <Text style={styles.actionText}>🖼️ Galería</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.search, !picked && styles.searchDisabled]} disabled={!picked || busy} onPress={search}>
        {busy ? <ActivityIndicator color="#fafaf9" /> : <Text style={styles.searchText}>Buscar similares</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#78716c', marginTop: 4, marginBottom: 16 },
  preview: { aspectRatio: 1, backgroundColor: '#f5f5f4', borderRadius: 12, borderColor: '#e7e5e4', borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#78716c' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  action: { flex: 1, backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionText: { fontWeight: '600', color: '#1c1917' },
  search: { backgroundColor: '#1c1917', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  searchDisabled: { backgroundColor: '#78716c' },
  searchText: { color: '#fafaf9', fontWeight: '700' },
});
