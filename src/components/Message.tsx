import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Reply, 
  Edit3, 
  Trash2, 
  Smile, 
  X, 
  Check, 
  CheckCheck,
  Clock,
  Image as ImageIcon,
  File,
  Download,
  Eye
} from 'lucide-react';
import { ChatMessage, MessageAttachment, MessageReaction } from '../lib/supabase';
import { formatMessageTime, getUserInitials, getAvatarColor } from '../lib/supabase';

interface MessageProps {
  message: ChatMessage;
  currentUserId?: string;
  currentUserRole?: 'user' | 'admin';
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onReact?: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>;
  onImageClick?: (imageUrl: string, fileName: string) => void;
  onFileDownload?: (fileUrl: string, fileName: string) => void;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  currentUserId,
  currentUserRole = 'user',
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  onImageClick,
  onFileDownload,
  showAvatar = true,
  showTimestamp = true,
  isEditing = false,
  onCancelEdit,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const isOwnMessage = message.sender_id === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canEdit = isOwnMessage || isAdmin;
  const canDelete = isOwnMessage || isAdmin;
  const canReact = true; // Tous les utilisateurs peuvent réagir

  // Gérer le mode édition
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Gérer la fermeture des actions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowActions(false);
        setShowReactions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rendu des réactions
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, MessageReaction[]>);

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => {
          const hasCurrentUserReacted = reactions.some(r => r.user_id === currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => {
                if (hasCurrentUserReacted) {
                  onRemoveReaction?.(message.id, emoji);
                } else {
                  onReact?.(message.id, emoji);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                hasCurrentUserReacted
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{emoji}</span>
              <span>{reactions.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // Rendu des attachments
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-2">
        {message.attachments.map((attachment) => {
          const isImage = attachment.file_type.startsWith('image/');
          
          return (
            <div key={attachment.id} className="relative">
              {isImage ? (
                <div className="relative group">
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onImageClick?.(attachment.file_url, attachment.file_name)}
                    onError={() => setImageError(attachment.id)}
                  />
                  {imageError === attachment.id && (
                    <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <File className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(attachment.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => onFileDownload?.(attachment.file_url, attachment.file_name)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Rendu du message parent (réponse)
  const renderParentMessage = () => {
    if (!message.replied_to_message_id || !message.parent_message) return null;

    return (
      <div className="border-l-4 border-gray-300 pl-3 mb-2 bg-gray-50 rounded-r-lg p-2">
        <div className="flex items-center gap-2 mb-1">
          <Reply className="h-3 w-3 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">
            {message.parent_message.sender?.name || 'Utilisateur'}
          </span>
        </div>
        <p className="text-sm text-gray-700 truncate">
          {message.parent_message.content}
        </p>
      </div>
    );
  };

  // Rendu des mentions
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            ref={editInputRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={Math.max(2, editContent.split('\n').length)}
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (editContent.trim() && onEdit) {
                  setIsSubmitting(true);
                  try {
                    await onEdit(message.id, editContent.trim());
                  } finally {
                    setIsSubmitting(false);
                  }
                }
              }}
              disabled={!editContent.trim() || isSubmitting}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    // Rendu des mentions avec mise en surbrillance
    const content = message.content;
    const mentions = message.mentions || [];
    
    if (mentions.length === 0) {
      return <p className="whitespace-pre-wrap break-words">{content}</p>;
    }

    // Créer une regex pour remplacer les mentions
    const mentionRegex = new RegExp(`@(${mentions.join('|')})`, 'g');
    const parts = content.split(mentionRegex);

    return (
      <p className="whitespace-pre-wrap break-words">
        {parts.map((part, index) => {
          if (mentions.includes(part)) {
            return (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-1 rounded font-medium"
              >
                @{part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  // Rendu du timestamp et statut
  const renderTimestamp = () => {
    if (!showTimestamp) return null;

    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <span>{formatMessageTime(message.created_at)}</span>
        {message.is_edited && (
          <span className="text-gray-400">(modifié)</span>
        )}
        {isOwnMessage && (
          <div className="flex items-center">
            {message.created_at === message.updated_at ? (
              <CheckCheck className="h-3 w-3 text-blue-500" />
            ) : (
              <Clock className="h-3 w-3 text-gray-400" />
            )}
          </div>
        )}
      </div>
    );
  };

  // Rendu des actions
  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className="absolute top-0 right-0 transform translate-x-full bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-10">
        <div className="flex flex-col gap-1">
          {canReact && (
            <button
              onClick={() => {
                setShowReactions(!showReactions);
                setShowActions(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Smile className="h-4 w-4" />
              Réagir
            </button>
          )}
          {onReply && (
            <button
              onClick={() => {
                onReply(message);
                setShowActions(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Reply className="h-4 w-4" />
              Répondre
            </button>
          )}
          {canEdit && onEdit && (
            <button
              onClick={() => {
                setEditContent(message.content);
                setShowActions(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                  onDelete(message.id);
                }
                setShowActions(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    );
  };

  // Rendu des réactions rapides
  const renderReactionPicker = () => {
    if (!showReactions) return null;

    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    return (
      <div className="absolute top-0 right-0 transform translate-x-full bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
        <div className="flex gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact?.(message.id, emoji);
                setShowReactions(false);
              }}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={messageRef}
      className={`flex gap-3 mb-4 group relative ${
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: getAvatarColor(message.sender_id) }}
          >
            {message.sender?.name ? getUserInitials(message.sender.name) : '??'}
          </div>
        </div>
      )}

      {/* Message content */}
      <div className={`flex-1 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
        {/* Nom de l'expéditeur */}
        {!isOwnMessage && message.sender && (
          <div className="text-xs font-medium text-gray-600 mb-1">
            {message.sender.name}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl break-words ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {/* Message parent (réponse) */}
          {renderParentMessage()}

          {/* Contenu du message */}
          {renderContent()}

          {/* Attachments */}
          {renderAttachments()}

          {/* Réactions */}
          {renderReactions()}

          {/* Timestamp */}
          {renderTimestamp()}
        </div>

        {/* Bouton d'actions */}
        <button
          onClick={() => setShowActions(!showActions)}
          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity ${
            isOwnMessage ? 'left-0 transform -translate-x-full' : 'right-0'
          }`}
        >
          <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>

        {/* Actions menu */}
        {renderActions()}

        {/* Reaction picker */}
        {renderReactionPicker()}
      </div>

      {/* Spacer pour les messages propres */}
      {isOwnMessage && <div className="w-8" />}
    </div>
  );
};

export default Message;




