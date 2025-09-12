import React, { useEffect, useState, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase-config';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [menu, setMenu] = useState(null);
  const [pressTimer, setPressTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const endRef = useRef(null);

  // Initialiser Supabase (une seule fois)
  const [supabase] = useState(() => createClient(supabaseConfig.url, supabaseConfig.anonKey));

  // Fonction pour récupérer les messages
  const fetchMessages = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profit_loss_chat')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Erreur Supabase:', error);
        setMessages([]);
      } else {
        console.log('Messages reçus de Supabase:', data);
        const formattedMessages = data.map(msg => ({
          ...msg,
          id: msg.id,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }));
        
        console.log('Messages formatés:', formattedMessages);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erreur fetch messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Supabase listener avec cleanup
  useEffect(() => {
    setLoading(true);
    setUpdating(false); // Reset de l'état updating au chargement
    
    fetchMessages();

    // Polling toutes les 2 secondes pour les nouveaux messages
    const interval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchMessages]);

  useEffect(() => {
    // Pas de scroll automatique à la réception
  }, [messages]);

  const addMessage = async () => {
    console.log('addMessage appelé avec:', newMsg);
    
    if (!newMsg.trim() || updating) {
      console.log('Message vide ou en cours d\'envoi');
      return;
    }
    
    setUpdating(true);
    console.log('Tentative d\'envoi vers Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('profit_loss_chat')
        .insert({
          text: newMsg.trim(),
          sender: "Admin", // Nom affiché pour admin
          sender_id: "admin", // ID unique pour admin
          reply_to: replyTo?.id || null,
          edited: false,
          deleted: false
        });
      
      console.log('Réponse Supabase:', { data, error });
      
      if (error) {
        console.error('Erreur ajout message:', error);
        alert(`Erreur Supabase: ${error.message}`);
        return;
      } else {
        console.log('Message envoyé avec succès');
        setNewMsg("");
        setReplyTo(null);
        // Recharger les messages après envoi
        fetchMessages();
        // Scroll vers le bas après envoi
        setTimeout(() => {
          endRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error('Erreur catch:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const updateMessage = async (id, changes) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profit_loss_chat')
        .update({
          ...changes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Erreur modification message:', error);
      }
    } catch (error) {
      console.error('Erreur modification message:', error);
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (msg) => {
    setEditing(msg.id);
    setEditText(msg.text);
    setMenu(null);
  };

  const saveEdit = async () => {
    if (editText.trim() && editing) {
      await updateMessage(editing, { text: editText.trim(), edited: true });
    }
    setEditing(null);
    setEditText("");
  };

  const deleteMsg = async (id) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profit_loss_chat')
        .update({ 
          deleted: true, 
          text: "Message supprimé",
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Erreur suppression message:', error);
      } else {
        setMenu(null);
      }
    } catch (error) {
      console.error('Erreur suppression message:', error);
    } finally {
      setUpdating(false);
    }
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

  // L'admin voit ses messages à droite, les autres à gauche
  const isMyMessage = (msg) => msg.sender_id === "admin";
  const getReplyMessage = (msg) => messages.find(m => m.id === msg.reply_to);

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        background: "#111827"
      }}
      onClick={closeMenu}
    >
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        background: "#111827", 
        padding: "15px",
        paddingBottom: "40px"
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
                  maxWidth: "60%",
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
          
          {menu.msg.sender_id === "1" && (
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
        borderTop: "1px solid #2d3748",
        position: "fixed",
        bottom: 0,
        left: 0, // Collé à gauche
        right: 0, // Collé à droite
        zIndex: 10000,
        paddingBottom: "env(safe-area-inset-bottom, 15px)"
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
            disabled={updating}
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

export default Chat;