import React, { useState, useEffect, useRef } from 'react';
import { db } from './FireBase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  serverTimestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import Header from './Header';

export default function Chat() {
  const { chatPartnerId } = useParams();
  const [currentUser, setCurrentUser] = useState(undefined); // undefined initially, null if unauthenticated
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Set current user on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setCurrentUser(user || null);
      if (user) {
        console.log("Authenticated user:", user.uid);
      } else {
        console.warn("User not authenticated.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const chatId = currentUser && chatPartnerId
    ? [currentUser.uid, chatPartnerId].sort().join("_")
    : null;

  // Fetch chat messages and mark partner messages as read
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(docs);

      // Mark unread messages from the chat partner as read
      const batch = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.senderId !== currentUser.uid && !data.read) {
          batch.push(setDoc(doc(db, "chats", chatId, "messages", docSnap.id), { read: true }, { merge: true }));
        }
      });

      await Promise.all(batch);
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    const container = chatContainerRef.current;
    container?.scrollTo(0, container.scrollHeight);
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    setError(""); // clear previous error

    if (!trimmedMessage || !currentUser?.uid || !chatPartnerId || !chatId) {
      setError("Cannot send an empty message or missing user/chat info.");
      return;
    }

    try {
      await setDoc(doc(db, "chats", chatId), {
        participants: [currentUser.uid, chatPartnerId],
        lastMessage: trimmedMessage,
        timestamp: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.uid,
        text: trimmedMessage,
        timestamp: serverTimestamp(),
        read: false
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  if (currentUser === undefined) {
    return <p className="text-center mt-10">Loading Chat...</p>;
  }

  if (currentUser === null) {
    return <p className="text-center mt-10 text-red-500">You must be logged in to use the chat.</p>;
  }

  return (
    <div>
      <div className ="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-md">
      <Header/>
      </div>
    <div className="flex flex-col h-screen max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold text-center mb-4">Chat</h2>

      <div
        ref={chatContainerRef}
        id="chat-container"
        className="flex-1 overflow-y-auto space-y-2 p-2 border rounded-md bg-gray-100"
      >
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`max-w-[70%] p-2 rounded-lg ${
                msg.senderId === currentUser.uid
                  ? 'bg-blue-500 text-white self-end ml-auto'
                  : 'bg-gray-300 text-black self-start mr-auto'
              }`}
            >
              <div>{msg.text}</div>
              {msg.timestamp && (
                <small className="block text-right text-xs text-gray-200 mt-1">
                  {msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              )}
              {msg.senderId === currentUser.uid && msg.read && (
                <small className="block text-right text-xs text-green-400 mt-1">Seen</small>
              )}
            </div>
          ))
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          ref={inputRef}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-1 border rounded-md px-3 py-2"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
    </div>
  );
}
