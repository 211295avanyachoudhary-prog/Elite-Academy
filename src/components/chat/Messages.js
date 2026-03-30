// 💬 Messages - Real-time 1-to-1 Chat
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, getDocs, doc, getDoc, updateDoc
} from 'firebase/firestore';
import { getOrCreateChatRoom } from '../../lib/gameLogic';
import toast from 'react-hot-toast';
import './Messages.css';

export default function Messages() {
  const { currentUser, userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch all users (classmates + anyone)
  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, 'users'));
      const allUsers = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.uid !== currentUser.uid);
      setUsers(allUsers);
    }
    fetchUsers();
  }, [currentUser]);

  // Open chat with a user
  async function openChat(user) {
    setSelectedUser(user);
    const roomId = await getOrCreateChatRoom(currentUser.uid, user.uid);
    setChatRoomId(roomId);
  }

  // Listen for messages in real time
  useEffect(() => {
    if (!chatRoomId) return;
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [chatRoomId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoomId) return;
    const text = newMessage.trim();
    setNewMessage('');

    try {
      // Add message to subcollection
      await addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), {
        text,
        senderId: currentUser.uid,
        senderName: userData.username,
        senderPhoto: userData.photoURL || '',
        createdAt: serverTimestamp(),
      });
      // Update last message on chat room
      await updateDoc(doc(db, 'chatRooms', chatRoomId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    }
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="messages-container fade-in-up">
      {/* Users list */}
      <div className="users-panel">
        <div className="users-header">
          <h2 className="panel-title">MESSAGES <span style={{ fontFamily: 'var(--font-jp)', fontSize: 11, color: 'var(--text-muted)' }}>メッセージ</span></h2>
          <input
            className="elite-input search-input"
            placeholder="Search students..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <p className="no-users">No other students enrolled yet.</p>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => openChat(user)}
              >
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.username} className="avatar" style={{ width: 44, height: 44 }} />
                  ) : (
                    <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: 16 }}>
                      {(user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="user-class-dot" data-class={user.currentClass} />
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-meta">
                    <span className={`class-badge ${user.currentClass}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      Class {user.currentClass}
                    </span>
                    <span className="user-points">⚡ {user.points || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="chat-panel">
        {!selectedUser ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p className="chat-empty-title">Select a student to chat</p>
            <p className="chat-empty-sub">Connect with your classmates</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: 16 }}>
                  {(selectedUser.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="chat-username">{selectedUser.username}</div>
                  <div className="chat-user-class">
                    <span className={`class-badge ${selectedUser.currentClass}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      Class {selectedUser.currentClass}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Classroom #{selectedUser.classroomNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-list">
              {messages.length === 0 && (
                <div className="chat-empty-msg">
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-bubble ${msg.senderId === currentUser.uid ? 'own' : 'other'}`}
                >
                  {msg.senderId !== currentUser.uid && (
                    <div className="msg-sender">{msg.senderName}</div>
                  )}
                  <div className="msg-text">{msg.text}</div>
                  <div className="msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form className="message-input-form" onSubmit={sendMessage}>
              <input
                className="elite-input message-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                ➤
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
