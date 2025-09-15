import React, { useEffect, useState, useRef } from "react";

const ProfitLoss = ({ channelId, currentUserId, supabase }: { channelId?: string; currentUserId?: string; supabase?: any }) => {
  console.log('ProfitLoss component rendering with props:', { channelId, currentUserId, supabase });
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [menu, setMenu] = useState(null);
  const [pressTimer, setPressTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadAt, setLastReadAt] = useState(null);
  const endRef = useRef(null);

  // Mode démo ou Supabase
  const isDemo = !supabase || !channelId || !currentUserId;

  // Charger les messages depuis localStorage (mode démo)
  useEffect(() => {
    console.log('ProfitLoss useEffect - channelId:', channelId, 'currentUserId:', currentUserId, 'isDemo:', isDemo);
    setLoading(true);
    try {
      const savedMessages = localStorage.getItem('profit-loss-messages');
      console.log('Saved messages from localStorage:', savedMessages);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        console.log('Parsed messages:', parsedMessages);
        setMessages(parsedMessages);
        
        // Simuler des messages non lus en mode démo
        if (isDemo) {
          const unread = parsedMessages.filter(msg => 
            msg.sender_id !== currentUserId && 
            (!lastReadAt || new Date(msg.created_at) > new Date(lastReadAt))
          ).length;
          setUnreadCount(unread);
        }
      } else {
        // Créer des messages de test si aucun message n'existe
        console.log('No messages found, creating test messages');
        const testMessages = [
          {
            id: '1',
            text: 'Bienvenue dans le salon Profit-Loss !',
            sender_id: 'admin',
            created_at: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          },
          {
            id: '2',
            text: 'Vous pouvez discuter de vos trades ici.',
            sender_id: 'admin',
            created_at: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ];
        setMessages(testMessages);
        localStorage.setItem('profit-loss-messages', JSON.stringify(testMessages));
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, currentUserId, lastReadAt]);

  // Sauvegarder les messages dans localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('profit-loss-messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = () => {
    if (!newMsg.trim() || updating) return;
    
    setUpdating(true);
    try {
      const newMessage = {
        id: Date.now().toString(),
        text: newMsg.trim(),
        sender_id: currentUserId || "admin",
        reply_to: replyTo?.id || null,
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      
      setMessages(prev => [...prev, newMessage]);
      setNewMsg("");
      setReplyTo(null);
    } catch (error) {
      console.error('Erreur ajout message:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updateMessage = (id, changes) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      setMessages(prev => prev.map(msg => 
        msg.id === id 
          ? { ...msg, ...changes, updated_at: new Date().toISOString() }
          : msg
      ));
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

  const saveEdit = () => {
    if (editText.trim() && editing) {
      updateMessage(editing, { text: editText.trim(), edited: true });
    }
    setEditing(null);
    setEditText("");
  };

  const deleteMsg = (id) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      setMessages(prev => prev.map(msg => 
        msg.id === id 
          ? { ...msg, deleted: true, text: "Message supprimé", deleted_at: new Date().toISOString() }
          : msg
      ));
      setMenu(null);
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

  const isMyMessage = (msg) => msg.sender_id === (currentUserId || "admin");
  const getReplyMessage = (msg) => messages.find(m => m.id === msg.reply_to);

  // Marquer comme lu
  const markAsRead = () => {
    setLastReadAt(new Date().toISOString());
    setUnreadCount(0);
  };

  // Simuler notification en mode démo
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    } else {
      console.log(`🔔 ${title}: ${body}`);
    }
  };

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        background: "#1a202c",
        position: "relative",
        overflow: "hidden"
      }}
      onClick={closeMenu}
    >
      {/* Test div pour vérifier le rendu */}
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        background: "red", 
        color: "white", 
        padding: "5px", 
        zIndex: 9999,
        fontSize: "12px"
      }}>
        PROFIT-LOSS COMPONENT LOADED
      </div>
      {/* Header avec pastille de messages non lus */}
      <div style={{
        padding: "10px 15px",
        background: "#2d3748",
        borderBottom: "1px solid #4a5568",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ color: "#e2e8f0", fontWeight: "bold" }}>
          💰 Profit-Loss {isDemo && "(Démo)"}
        </div>
        {unreadCount > 0 && (
          <div style={{
            background: "#ef4444",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "12px",
            fontWeight: "bold",
            minWidth: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {unreadCount}
          </div>
        )}
      </div>

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
                    {msg.sender_id === "admin" ? "Admin" : "Utilisateur"}
                  </div>
                )}
                
                {reply && (
                  <div style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    marginBottom: "4px",
                    fontSize: "12px",
                    borderLeft: "3px solid #4299e1"
                  }}>
                    <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                      {reply.sender_id === "admin" ? "Admin" : "Utilisateur"}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      {reply.text.length > 50 ? reply.text.substring(0, 50) + "..." : reply.text}
                    </div>
                  </div>
                )}
                
                <div>{msg.text}</div>
                <div style={{ 
                  fontSize: "11px", 
                  opacity: 0.7, 
                  marginTop: "4px",
                  textAlign: isMe ? "right" : "left"
                }}>
                  {msg.time}
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
            position: "absolute",
            left: menu.x,
            top: menu.y,
            background: "#4a5568",
            border: "1px solid #2d3748",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            minWidth: "140px",
            padding: "8px 0"
          }}
        >
          <button
            onClick={() => handleAction('reply', menu.msg)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              color: "#e2e8f0",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px"
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.background = "#2d3748"}
            onMouseLeave={(e) => (e.target as HTMLElement).style.background = "none"}
          >
            💬 Répondre
          </button>
          {isMyMessage(menu.msg) && (
            <>
              <button
                onClick={() => handleAction('edit', menu.msg)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  color: "#e2e8f0",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.background = "#2d3748"}
                onMouseLeave={(e) => (e.target as HTMLElement).style.background = "none"}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleAction('delete', menu.msg)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.background = "#2d3748"}
                onMouseLeave={(e) => (e.target as HTMLElement).style.background = "none"}
              >
                🗑️ Supprimer
              </button>
            </>
          )}
        </div>
      )}

      {/* Zone d'envoi */}
      <div style={{ 
        padding: "15px", 
        background: "#1a202c", 
        borderTop: "1px solid #2d3748",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        paddingBottom: "env(safe-area-inset-bottom, 15px)"
      }}>
        {replyTo && (
          <div style={{ 
            background: "#2d3748", 
            padding: "8px 12px", 
            borderRadius: "8px", 
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ color: "#4299e1", fontSize: "12px" }}>
              Répondre à: {replyTo.text.length > 30 ? replyTo.text.substring(0, 30) + "..." : replyTo.text}
            </div>
            <button
              onClick={() => setReplyTo(null)}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              ✕
            </button>
          </div>
        )}
        
        {editing && (
          <div style={{ marginBottom: "8px" }}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#2d3748",
                border: "1px solid #4a5568",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "14px"
              }}
              placeholder="Modifier le message..."
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                onClick={saveEdit}
                style={{
                  padding: "6px 12px",
                  background: "#4299e1",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setEditText("");
                }}
                style={{
                  padding: "6px 12px",
                  background: "#4a5568",
                  border: "none",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMessage()}
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "#2d3748",
              border: "1px solid #4a5568",
              borderRadius: "20px",
              color: "#e2e8f0",
              fontSize: "14px"
            }}
            placeholder="Écrire un message..."
            disabled={updating}
          />
          <button
            onClick={addMessage}
            disabled={updating || !newMsg.trim()}
            style={{
              padding: "10px 16px",
              background: updating || !newMsg.trim() ? "#4a5568" : "#4299e1",
              border: "none",
              borderRadius: "20px",
              color: "white",
              cursor: updating || !newMsg.trim() ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            {updating ? "..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;