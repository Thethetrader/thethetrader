import React, { useEffect, useState, useRef } from "react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [menu, setMenu] = useState(null);
  const [pressTimer, setPressTimer] = useState(null);
  const endRef = useRef(null);

  // Messages de démo
  useEffect(() => {
    setMessages([
      { id: 1, text: "Salut ! Comment ça va ?", sender: "Alice", senderId: "2", time: "19:46", replyTo: null, edited: false, deleted: false },
      { id: 2, text: "Ça va bien merci ! Et toi ?", sender: "Moi", senderId: "1", time: "19:47", replyTo: null, edited: false, deleted: false },
      { id: 3, text: "Super ! Tu fais quoi ce weekend ?", sender: "Alice", senderId: "2", time: "19:48", replyTo: null, edited: false, deleted: false }
    ]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = () => {
    if (!newMsg.trim()) return;
    const msg = {
      id: Date.now(),
      text: newMsg,
      sender: "Moi",
      senderId: "1",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      replyTo: replyTo?.id || null,
      edited: false,
      deleted: false
    };
    setMessages(prev => [...prev, msg]);
    setNewMsg("");
    setReplyTo(null);
  };

  const updateMessage = (id, changes) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
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
    updateMessage(id, { deleted: true, text: "Message supprimé" });
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

  const isMyMessage = (msg) => msg.senderId === "1";
  const getReplyMessage = (msg) => messages.find(m => m.id === msg.replyTo);

  return (
    <div 
      style={{ 
        position: "fixed",
        top: 0,
        left: window.innerWidth > 768 ? "254px" : "0px",
        width: window.innerWidth > 768 ? "calc(100vw - 254px)" : "100vw",
        margin: 0,
        padding: 0, 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        background: "#111827",
        zIndex: 1000
      }}
      onClick={closeMenu}
    >
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        background: "#111827", 
        padding: "15px" 
      }}>
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
          
          {menu.msg.senderId === "1" && (
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
        background: "#111827", 
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
              backgroundColor: "#4299e1",
              color: "#fff",
              border: "none",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
            onClick={addMessage}
            disabled={!newMsg.trim()}
          >
            📤 Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
