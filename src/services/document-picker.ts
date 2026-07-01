/**
 * Document Picker Helper
 * Wrapper for expo-document-picker to handle file selection
 */

import * as DocumentPicker from 'expo-document-picker';

export interface PickResult {
  canceled: boolean;
  assets: DocumentPicker.DocumentPickerAsset[] | null;
}

export async function pickFile(options?: DocumentPicker.DocumentPickerOptions): Promise<PickResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync(options);
    return {
      canceled: result.canceled,
      assets: result.assets as DocumentPicker.DocumentPickerAsset[],
    };
  } catch (error) {
    console.error('[DocumentPicker] Error:', error);
    return {
      canceled: true,
      assets: null,
    };
  }
}
