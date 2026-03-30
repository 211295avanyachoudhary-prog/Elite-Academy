// 💬 Real-time Chat
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase/config';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, getDocs, doc, getDoc
} from 'firebase/firestore';
import './Chat.css';

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export default function ChatPage() {
  const { user, userData } = useAuth();
  const [classmates, setClassmates] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch classmates
  useEffect(() => {
    if (!userData?.classroomId) return;
    const fetchClassmates = async () => {
      const classroomSnap = await getDoc(doc(db, 'classrooms', userData.classroomId));
      if (!classroomSnap.exists()) return;
      const classes = classroomSnap.data().classes;
      const allIds = [...classes.A, ...classes.B, ...classes.C, ...classes.D]
        .filter(id => id !== user.uid);
      if (allIds.length === 0) { setLoadingUsers(false); return; }
      const users = [];
      for (const id of allIds) {
        const snap = await getDoc(doc(db, 'users', id));
        if (snap.exists()) users.push({ id: snap.id, ...snap.data() });
      }
      setClassmates(users);
      setLoadingUsers(false);
    };
    fetchClassmates();
  }, [userData]);

  // Listen for messages
  useEffect(() => {
    if (!activeChatUser) return;
    const chatId = getChatId(user.uid, activeChatUser.id);
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [activeChatUser]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChatUser) return;
    const chatId = getChatId(user.uid, activeChatUser.id);
    await addDoc(collection(db, 'messages'), {
      chatId,
      senderId: user.uid,
      senderName: userData.username,
      senderPhoto: userData.photoURL || '',
      text: newMsg.trim(),
      createdAt: new Date().toISOString()
    });
    setNewMsg('');
  };

  return (
    <div className="chat-page">
      {/* Users list */}
      <div className={`chat-sidebar ${activeChatUser ? 'hidden-mobile' : ''}`}>
        <h3 className="sidebar-title">💬 Classmates</h3>
        {loadingUsers ? (
          <div className="chat-loading"><span className="spinner-sm" /></div>
        ) : classmates.length === 0 ? (
          <p className="empty-chat">No classmates yet. Invite friends!</p>
        ) : classmates.map(cm => (
          <div
            key={cm.id}
            className={`cm-row ${activeChatUser?.id === cm.id ? 'active' : ''}`}
            onClick={() => setActiveChatUser(cm)}
          >
            <div className="cm-avatar">
              {cm.photoURL
                ? <img src={cm.photoURL} alt="" />
                : <span>{cm.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="cm-info">
              <span className="cm-name">{cm.username}</span>
              <span className="cm-class">Class {cm.currentClass}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div className={`chat-window ${!activeChatUser ? 'hidden-mobile' : ''}`}>
        {!activeChatUser ? (
          <div className="chat-placeholder">
            <span>Select a classmate to chat</span>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="back-btn" onClick={() => setActiveChatUser(null)}>←</button>
              <div className="chat-header-avatar">
                {activeChatUser.photoURL
                  ? <img src={activeChatUser.photoURL} alt="" />
                  : <span>{activeChatUser.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <div className="chat-header-name">{activeChatUser.username}</div>
                <div className="chat-header-class">Class {activeChatUser.currentClass}</div>
              </div>
            </div>

            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className={`msg-bubble ${msg.senderId === user.uid ? 'mine' : 'theirs'}`}>
                  <div className="msg-text">{msg.text}</div>
                  <div className="msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} disabled={!newMsg.trim()}>➤</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
