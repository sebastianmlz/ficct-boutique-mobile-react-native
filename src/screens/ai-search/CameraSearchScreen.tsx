import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { searchSimilarImages, type SimilarityResult } from '@/services/ai/ai.service';
import { AppButton, AppIcon, ScreenContainer, SectionHeader } from '@/components';
import { colors, fontSize, radius, spacing } from '@/theme';

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
    } catch {
      Alert.alert('Búsqueda no disponible', 'No pudimos procesar la imagen. Inténtalo de nuevo con otra foto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <SectionHeader
        title="Buscar por imagen"
        subtitle="Toma una foto de una prenda o sube una imagen y encontraremos artículos similares en la boutique."
      />

      <View style={styles.preview}>
        {picked ? (
          <Image source={{ uri: picked.uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <AppIcon name="camera" size={30} color={colors.mute} />
            <Text style={styles.placeholderText}>Sin imagen seleccionada</Text>
            <Text style={styles.placeholderHint}>Usa la cámara o tu galería</Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <AppButton label="Cámara" icon="camera" variant="secondary" onPress={pickFromCamera} style={styles.flex} />
        <AppButton label="Galería" icon="gallery" variant="secondary" onPress={pickFromGallery} style={styles.flex} />
      </View>

      <AppButton
        label={picked ? 'Buscar similares' : 'Selecciona una imagen'}
        icon="search"
        onPress={search}
        loading={busy}
        disabled={!picked}
        fullWidth
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  preview: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderColor: colors.line,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', gap: 6 },
  placeholderText: { color: colors.ink, fontSize: fontSize.base, fontWeight: '600' },
  placeholderHint: { color: colors.mute, fontSize: fontSize.sm },
  buttons: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
