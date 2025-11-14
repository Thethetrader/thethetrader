import { useState, useCallback } from 'react';
import supabaseClient, { uploadFile, getPublicUrl } from '../lib/supabase';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface UseFileUploadOptions {
  bucket?: string;
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (fileName: string, error: string) => void;
}

export interface UploadedFile {
  id: string;
  filename: string;
  url: string;
  publicUrl: string;
  size: number;
  mimeType: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  uploadedAt: string;
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm'];
const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const getFileType = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (SUPPORTED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  return 'other';
};

const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${userId}/${timestamp}-${randomStr}.${extension}`;
};

export const useFileUpload = ({
  bucket = 'chat-files',
  maxFileSize = 10, // 10MB par défaut
  allowedTypes = [
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_VIDEO_TYPES,
    ...SUPPORTED_AUDIO_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES
  ],
  onUploadComplete,
  onUploadError
}: UseFileUploadOptions = {}) => {
  const [uploads, setUploads] = useState<{ [fileName: string]: UploadProgress }>({});
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Vérifier la taille
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `Le fichier est trop volumineux. Taille maximale: ${maxFileSize}MB`
      };
    }

    // Vérifier le type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non supporté'
      };
    }

    return { valid: true };
  }, [maxFileSize, allowedTypes]);

  const uploadFile = useCallback(async (file: File, userId: string): Promise<UploadedFile> => {
    // Validation
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileName = generateFileName(file.name, userId);

    // Initialiser le progrès
    setUploads(prev => ({
      ...prev,
      [file.name]: {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }
    }));

    try {
      // Upload vers Supabase Storage
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const uploadedFile: UploadedFile = {
        id: data.id || fileName,
        filename: file.name,
        url: data.path,
        publicUrl,
        size: file.size,
        mimeType: file.type,
        type: getFileType(file.type),
        uploadedAt: new Date().toISOString()
      };

      // Marquer comme complété
      setUploads(prev => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          progress: 100,
          status: 'completed',
          url: publicUrl
        }
      }));

      onUploadComplete?.(uploadedFile);

      // Nettoyer après 3 secondes
      setTimeout(() => {
        setUploads(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });
      }, 3000);

      return uploadedFile;

    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de l\'upload';

      // Marquer comme erreur
      setUploads(prev => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage
        }
      }));

      onUploadError?.(file.name, errorMessage);

      // Nettoyer après 5 secondes
      setTimeout(() => {
        setUploads(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });
      }, 5000);

      throw error;
    }
  }, [bucket, validateFile, onUploadComplete, onUploadError]);

  const uploadMultipleFiles = useCallback(async (files: File[], userId: string): Promise<UploadedFile[]> => {
    setIsUploading(true);

    const uploadPromises = files.map(file => uploadFile(file, userId));

    try {
      const results = await Promise.allSettled(uploadPromises);

      const successfulUploads: UploadedFile[] = [];
      const failedUploads: { fileName: string; error: string }[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          failedUploads.push({
            fileName: files[index].name,
            error: result.reason.message || 'Erreur inconnue'
          });
        }
      });

      return successfulUploads;

    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  const removeUpload = useCallback((fileName: string) => {
    setUploads(prev => {
      const { [fileName]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const cancelUpload = useCallback((fileName: string) => {
    // Note: Supabase ne supporte pas l'annulation d'upload natif
    // On peut seulement supprimer de notre état local
    removeUpload(fileName);
  }, [removeUpload]);

  const deleteFile = useCallback(async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabaseClient.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

    } catch (error: any) {
      console.error('Erreur suppression fichier:', error);
      throw error;
    }
  }, [bucket]);

  const getFilePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Le fichier n\'est pas une image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsDataURL(file);
    });
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Statistiques des uploads
  const uploadStats = {
    total: Object.keys(uploads).length,
    uploading: Object.values(uploads).filter(u => u.status === 'uploading').length,
    completed: Object.values(uploads).filter(u => u.status === 'completed').length,
    failed: Object.values(uploads).filter(u => u.status === 'error').length,
    totalProgress: Object.values(uploads).length > 0
      ? Object.values(uploads).reduce((acc, upload) => acc + upload.progress, 0) / Object.keys(uploads).length
      : 0
  };

  return {
    uploads,
    isUploading,
    uploadFile,
    uploadMultipleFiles,
    removeUpload,
    cancelUpload,
    deleteFile,
    getFilePreview,
    formatFileSize,
    validateFile,
    uploadStats,
    supportedTypes: {
      images: SUPPORTED_IMAGE_TYPES,
      videos: SUPPORTED_VIDEO_TYPES,
      audio: SUPPORTED_AUDIO_TYPES,
      documents: SUPPORTED_DOCUMENT_TYPES
    }
  };
};