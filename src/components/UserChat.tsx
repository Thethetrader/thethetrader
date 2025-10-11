import React, { useEffect, useState, useRef } from "react";
import {
  sendMessage as supabaseSendMessage,
  getMessages as supabaseGetMessages,
  subscribeToMessages as supabaseSubscribeToMessages,
  addReaction as supabaseAddReaction,
  removeReaction as supabaseRemoveReaction,
  getCurrentUser,
  getUserProfile,
  getUserProfileByType,
  isUserAdmin,
  supabase
} from '../lib/supabase';

const UserChat = ({ channelId = 'chatzone' }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [menu, setMenu] = useState(null);
  const [pressTimer, setPressTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const endRef = useRef(null);

  // États Supabase
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [supabaseProfile, setSupabaseProfile] = useState(null);
  const [currentChannelId, setCurrentChannelId] = useState('');
  const [isSupabaseAdmin, setIsSupabaseAdmin] = useState(false);

  // Initialisation Supabase
  useEffect(() => {
    const initializeSupabase = async () => {
      try {

        // Nettoyage forcé des messages de démo d'avant
        setMessages([]);

        // Charger l'utilisateur actuel
        const user = await getCurrentUser();
        if (user) {
          setSupabaseUser(user);

          // Charger le profil utilisateur
          const { data: profile } = await getUserProfileByType('user');
          if (profile) {
            setSupabaseProfile(profile);
          }

          // Vérifier si admin
          const adminStatus = await isUserAdmin(user.id);
          setIsSupabaseAdmin(adminStatus);
        } else {
        }

        // Récupérer l'ID du canal
        const { data: channelData } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('name', channelId)
          .single();

        if (channelData) {
          setCurrentChannelId(channelData.id);

          // Charger SEULEMENT les messages depuis Supabase (pas de fallback)
          const { data: messagesData } = await supabaseGetMessages(channelData.id);
          if (messagesData && messagesData.length > 0) {
            // Convertir les messages Supabase au format local (SEULEMENT SUPABASE)
            const convertedMessages = messagesData.map((msg) => ({
              id: msg.id,
              text: msg.content,
              user: msg.author?.name || (msg as any).author_name || msg.author?.email || 'Utilisateur',
              userId: msg.author_id,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              timestamp: msg.created_at,
              reactions: {}
            }));

            setMessages(convertedMessages);
          } else {
            // AUCUN MESSAGE PAR DÉFAUT sinon; Supabase uniquement
            setMessages([]);
          }
        } else {
          // Pas de canal → AUCUN MESSAGE
          setMessages([]);
        }

      } catch (error) {
        console.error('❌ Erreur initialisation Supabase côté user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSupabase();
  }, [channelId]);

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!currentChannelId) return;


    const subscription = supabaseSubscribeToMessages(currentChannelId, (newMessage) => {

      // Convertir au format local
      const convertedMessage = {
        id: newMessage.id,
        text: newMessage.content,
        user: newMessage.author?.name || (newMessage as any).author_name || newMessage.author?.email || 'Utilisateur',
        userId: newMessage.author_id,
        time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: newMessage.created_at,
        reactions: {}
      };

      setMessages(prev => [...prev, convertedMessage]);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentChannelId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = async () => {
    if (!newMsg.trim() || updating || !supabaseUser || !currentChannelId) return;

    setUpdating(true);
    try {

      const { data, error } = await supabaseSendMessage(currentChannelId, newMsg.trim());

      if (error) {
        console.error('❌ UserChat - Erreur envoi message Supabase:', error);
      } else {
        // Le message sera ajouté automatiquement via l'abonnement temps réel
      }

      setNewMsg("");
      setReplyTo(null);
    } catch (error) {
      console.error('❌ UserChat - Erreur envoi message:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Fonctions Firebase désactivées - remplacées par Supabase
  const updateMessage = async (id, changes) => {
  };

  const startEdit = (msg) => {
    setMenu(null);
  };

  const saveEdit = () => {
    setEditing(null);
    setEditText("");
  };

  const deleteMsg = async (id) => {
    setMenu(null);
  };

  const showMenu = (e, msg) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const startPress = (e, msg) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setMenu({ x: touch.clientX, y: touch.clientY, msg });
    }, 500);
    setPressTimer(timer);
  };

  const endPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const closeMenu = () => setMenu(null);

  const handleAction = (action, msg) => {
    if (action === 'reply') setReplyTo(msg);
    if (action === 'edit') startEdit(msg);
    if (action === 'delete') deleteMsg(msg.id);
    closeMenu();
  };

  const isMyMessage = (msg) => msg.senderId === "user_1";
  const getReplyMessage = (msg) => messages.find(m => m.id === msg.replyTo);

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        background: "#1a202c"
      }}
      onClick={closeMenu}
    >
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        background: "#2d3748", 
        padding: "15px" 
      }}>
        {loading && (
          <div style={{ 
            textAlign: "center", 
            color: "#a0aec0", 
            padding: "20px",
            fontSize: "14px"
          }}>
            🔄 Chargement des messages...
          </div>
        )}
        {messages.map(msg => {
          const isMe = isMyMessage(msg);
          const reply = getReplyMessage(msg);
          
          return (
            <div key={msg.id} style={{ 
              display: "flex", 
              justifyContent: isMe ? "flex-end" : "flex-start",
              marginBottom: "8px" 
            }}>
              <div 
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "18px",
                  background: isMe ? "#4299e1" : "#4a5568",
                  color: isMe ? "#ffffff" : "#e2e8f0",
                  boxShadow: "0px 1px 3px rgba(0,0,0,0.3)",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                onContextMenu={(e) => showMenu(e, msg)}
                onTouchStart={(e) => startPress(e, msg)}
                onTouchEnd={endPress}
                onTouchMove={endPress}
              >
                {!isMe && (
                  <div style={{ 
                    fontWeight: "bold", 
                    color: "#4299e1", 
                    fontSize: "13px", 
                    marginBottom: "3px" 
                  }}>
                    {msg.sender}
                  </div>
                )}

                {reply && (
                  <div style={{
                    fontSize: "12px",
                    color: "#a0aec0",
                    borderLeft: "3px solid #4299e1",
                    margin: "4px 0 8px 0",
                    background: "rgba(66, 153, 225, 0.1)",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    minHeight: "auto"
                  }}>
                    <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "3px" }}>
                      ↪ {reply.sender}
                    </div>
                    <div style={{ 
                      wordWrap: "break-word",
                      lineHeight: "1.3"
                    }}>
                      {reply.text}
                    </div>
                  </div>
                )}

                <div>
                  {msg.deleted ? (
                    <span style={{ color: "#718096", fontStyle: "italic" }}>
                      🚫 Message supprimé
                    </span>
                  ) : editing === msg.id ? (
                    <div>
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") { setEditing(null); setEditText(""); }
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: "1px solid #4299e1",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                          background: "#2d3748",
                          color: "#e2e8f0"
                        }}
                      />
                      <div style={{ fontSize: "11px", color: "#a0aec0", marginTop: "2px" }}>
                        Entrée = sauver, Échap = annuler
                      </div>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                <div style={{ 
                  fontSize: "11px", 
                  color: "#a0aec0", 
                  textAlign: "right", 
                  marginTop: "4px" 
                }}>
                  {msg.time}
                  {msg.edited && <span style={{ color: "#4299e1" }}> ✏️</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Menu contextuel */}
      {menu && (
        <div
          style={{
            position: "fixed",
            left: menu.x,
            top: menu.y,
            background: "#4a5568",
            border: "1px solid #2d3748",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            minWidth: "140px",
            overflow: "hidden"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "10px 15px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#4299e1",
              fontWeight: "500",
              borderBottom: "1px solid #2d3748"
            }}
            onClick={() => handleAction('reply', menu.msg)}
          >
            ↩️ Répondre
          </div>
          
          {menu.msg.senderId === "user_1" && (
            <>
              <div
                style={{
                  padding: "10px 15px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#ed8936",
                  fontWeight: "500",
                  borderBottom: "1px solid #2d3748"
                }}
                onClick={() => handleAction('edit', menu.msg)}
              >
                ✏️ Modifier
              </div>
              <div
                style={{
                  padding: "10px 15px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#f56565",
                  fontWeight: "500"
                }}
                onClick={() => handleAction('delete', menu.msg)}
              >
                🗑️ Supprimer
              </div>
            </>
          )}
        </div>
      )}

      {/* Zone d'envoi */}
      <div style={{ 
        padding: "15px", 
        background: "#1a202c", 
        borderTop: "1px solid #2d3748" 
      }}>
        {replyTo && (
          <div style={{ 
            marginBottom: "8px", 
            background: "#2d3748", 
            padding: "8px 12px", 
            borderRadius: "8px",
            fontSize: "13px",
            borderLeft: "3px solid #ed8936"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ color: "#e2e8f0" }}>Réponse à {replyTo.sender}:</strong>
                <div style={{ 
                  color: "#a0aec0", 
                  marginTop: "2px", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap" 
                }}>
                  {replyTo.text}
                </div>
              </div>
              <span 
                style={{ cursor: "pointer", color: "#f56565", fontSize: "16px" }} 
                onClick={() => setReplyTo(null)}
              >
                ❌
              </span>
            </div>
          </div>
        )}
        
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            style={{ 
              flex: 1, 
              padding: "12px 16px", 
              borderRadius: "25px", 
              border: "1px solid #4a5568", 
              fontSize: "14px",
              outline: "none",
              background: "#2d3748",
              color: "#e2e8f0"
            }}
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMessage()}
            placeholder="Écrire un message..."
          />
          <button
            style={{
              padding: "12px 20px",
              borderRadius: "25px",
              backgroundColor: updating ? "#718096" : "#4299e1",
              color: "#fff",
              border: "none",
              fontSize: "14px",
              cursor: updating ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: updating ? 0.7 : 1
            }}
            onClick={addMessage}
            disabled={!newMsg.trim() || updating}
          >
            {updating ? "⏳ Envoi..." : "📤 Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserChat;
