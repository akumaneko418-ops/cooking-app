import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * フォトライブラリから画像を選択し、ローカルURIを返す
 * 権限がない場合は null を返す
 */
export const pickImageFromLibrary = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
};

/**
 * ローカルURIの画像をSupabase Storageにアップロードし、公開URLを返す
 * @param localUri 端末上の画像URI
 * @param recipeId レシピID（ファイル名に使用）
 */
export const uploadRecipeImage = async (
    localUri: string,
    recipeId: string
): Promise<string | null> => {
    try {
        const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${recipeId}_${Date.now()}.${ext}`;
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

        // React Native では、ファイルのバイナリを直接アップロードするために
        // base64 に変換してから ArrayBuffer として送信するのが最も確実です。
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: 'base64',
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(fileName, decode(base64), {
                contentType,
                upsert: true,
            });

        if (uploadError) {
            console.error('画像アップロードエラー:', uploadError.message);
            return null;
        }

        const { data } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (err) {
        console.error('画像アップロード例外:', err);
        return null;
    }
};

/**
 * Web環境（File/Blob）から画像をアップロードし、公開URLを返す
 */
export const uploadRecipeImageWeb = async (
    file: File | Blob,
    recipeId: string
): Promise<string | null> => {
    try {
        const ext = file.type.split('/').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${recipeId}_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('画像アップロード（Web）エラー:', uploadError.message);
            return null;
        }

        const { data } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (err) {
        console.error('画像アップロード（Web）例外:', err);
        return null;
    }
};
/**
 * フィードバック画像をアップロードし、公開URLを返す
 */
export const uploadFeedbackImage = async (
    source: string | File | Blob,
    userId: string
): Promise<string | null> => {
    // Web環境でURI文字列が渡された場合の処理
    if (Platform.OS === 'web' && typeof source === 'string') {
        try {
            const response = await fetch(source);
            const blob = await response.blob();
            return uploadRecipeImageWeb(blob, `feedback_${userId}`);
        } catch (err) {
            console.error('Web画像変換エラー:', err);
            return null;
        }
    }

    if (typeof source === 'string') {
        // モバイル（ローカルURI）の場合
        return uploadRecipeImage(source, `feedback_${userId}`);
    } else {
        // Web（File/Blob）の場合
        return uploadRecipeImageWeb(source, `feedback_${userId}`);
    }
};

/**
 * Supabase Storage から指定されたURLのファイルを削除する
 * @param publicUrl 削除対象の公開URL
 * @param bucket バケット名
 */
export const deleteImageFromStorage = async (
    publicUrl: string,
    bucket: string
): Promise<boolean> => {
    try {
        // URL からファイル名を抽出
        // 例: https://.../storage/v1/object/public/bucket-name/filename.jpg
        const parts = publicUrl.split('/');
        const fileName = parts.pop();

        if (!fileName) return false;

        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

        if (error) {
            console.error('ストレージからの削除エラー:', error.message);
            return false;
        }

        return true;
    } catch (err) {
        console.error('ストレージからの削除例外:', err);
        return false;
    }
};
