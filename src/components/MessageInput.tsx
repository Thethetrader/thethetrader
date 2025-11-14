import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  X, 
  Loader2, 
  AlertCircle,
  File,
  Trash2,
  Eye
} from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onCancelReply?: () => void;
  replyToMessage?: {
    id: string;
    content: string;
    senderName: string;
  };
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number; // en MB
  maxFiles?: number;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  error?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onCancelReply,
  replyToMessage,
  placeholder = "Tapez votre message...",
  disabled = false,
  isLoading = false,
  maxLength = 2000,
  allowedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  maxFileSize = 10, // 10MB
  maxFiles = 5,
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Auto-resize du textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  // Effet pour ajuster la hauteur du textarea
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Validation des fichiers
  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Fichier trop volumineux (max ${maxFileSize}MB)`;
    }

    // Vérifier le type
    const isValidType = allowedFileTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      return `Type de fichier non autorisé`;
    }

    return null;
  };

  // Créer un aperçu pour les images
  const createFilePreview = (file: File): Promise<FilePreview> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      const error = validateFile(file);
      
      if (error) {
        resolve({ file, id, error });
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file,
            id,
            preview: e.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({ file, id });
      }
    });
  };

  // Ajouter des fichiers
  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Vérifier le nombre maximum de fichiers
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const previews = await Promise.all(
        fileArray.map(file => createFilePreview(file))
      );

      setFiles(prev => [...prev, ...previews]);
    } catch (err) {
      setError('Erreur lors du traitement des fichiers');
    } finally {
      setIsUploading(false);
    }
  }, [files.length, maxFiles]);

  // Supprimer un fichier
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setError(null);
  }, []);

  // Gestion du drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  // Gestion de la sélection de fichiers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset l'input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  // Gestion du paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const clipboardFiles = e.clipboardData.files;
    if (clipboardFiles.length > 0) {
      addFiles(clipboardFiles);
    }
  }, [addFiles]);

  // Envoyer le message
  const handleSend = useCallback(async () => {
    if (!message.trim() && files.length === 0) return;

    const content = message.trim();
    const attachments = files.map(f => f.file);

    try {
      setError(null);
      await onSendMessage(content, attachments);
      
      // Reset le formulaire
      setMessage('');
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
    }
  }, [message, files, onSendMessage]);

  // Gestion des touches
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Rendu de l'aperçu des fichiers
  const renderFilePreviews = () => {
    if (files.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-t border-gray-200">
        {files.map((filePreview) => (
          <div key={filePreview.id} className="relative group">
            {filePreview.error ? (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg max-w-xs">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-700 truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-red-600">
                    {filePreview.error}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(filePreview.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : filePreview.preview ? (
              <div className="relative">
                <img
                  src={filePreview.preview}
                  alt={filePreview.file.name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeFile(filePreview.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg max-w-xs">
                <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(filePreview.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(filePreview.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Rendu du message de réponse
  const renderReplyPreview = () => {
    if (!replyToMessage) return null;

    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-700">
            Répondre à {replyToMessage.senderName}
          </p>
          <p className="text-sm text-blue-600 truncate">
            {replyToMessage.content}
          </p>
        </div>
        <button
          onClick={onCancelReply}
          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Message de réponse */}
      {renderReplyPreview()}

      {/* Aperçu des fichiers */}
      {renderFilePreviews()}

      {/* Zone de saisie */}
      <div
        className={`relative p-4 transition-colors ${
          isDragging ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Overlay de drag & drop */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-700">
                Déposez vos fichiers ici
              </p>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            {/* Upload de fichiers */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Joindre des fichiers"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Input fichier caché */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedFileTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Zone de texte */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
            />
            
            {/* Compteur de caractères */}
            {maxLength && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Bouton d'envoi */}
          <button
            onClick={handleSend}
            disabled={disabled || isLoading || (!message.trim() && files.length === 0)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Envoyer le message (Entrée)"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-2 text-xs text-gray-500">
          <p>
            Appuyez sur <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Entrée</kbd> pour envoyer, 
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Shift+Entrée</kbd> pour une nouvelle ligne
          </p>
          <p className="mt-1">
            Glissez-déposez des images ou collez-les avec <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+V</kbd>
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;




