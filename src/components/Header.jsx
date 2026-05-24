import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Search, LogOut, Waves } from 'lucide-react';
import { collection, query, getDocs, where, doc, getDoc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from './FireBase';

function Header() {
  const [search, setSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (search.trim().length === 0) {
        setShowSearchResults(false);
        setSearchResults([]);
        return;
      }
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('name', '>=', search),
          where('name', '<=', search + '')
        );
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSearchResults(users);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error fetching results: ', error);
        setSearchResults([]);
      }
    };
    const delay = setTimeout(fetchResults, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSearchProfile = (uid) => {
    navigate(`/profile/${uid}`);
    setShowSearchResults(false);
    setSearch('');
  };

  const markChatAsRead = async (chatId) => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const unreadQ = query(messagesRef, where('read', '==', false), where('senderId', '!=', currentUser.uid));
      const unreadMessages = await getDocs(unreadQ);
      unreadMessages.forEach((messageDoc) => {
        batch.update(doc(db, 'chats', chatId, 'messages', messageDoc.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleOpenChat = (chat) => {
    markChatAsRead(chat.id);
    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c)));
    setUnreadMessageCount((prev) => prev - chat.unreadCount);
    navigate(`/chat/${chat.otherUserId}`);
    setShowChatDropdown(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        let unreadCount = 0;
        const chatList = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const chatId = docSnap.id;
            const otherUserId = data.participants.find((id) => id !== user.uid);
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : {};
            const messagesSnapshot = await getDocs(
              query(collection(db, 'chats', chatId, 'messages'), where('read', '==', false))
            );
            unreadCount += messagesSnapshot.size;
            const lastMessage = data.messages?.length > 0 ? data.messages[data.messages.length - 1] : null;
            return {
              id: chatId,
              ...data,
              otherUserId,
              otherUserName: otherUser.name || 'Unknown',
              lastMessage: lastMessage ? lastMessage.text : 'No messages yet',
              unreadCount: messagesSnapshot.size,
            };
          })
        );
        setChats(chatList);
        setUnreadMessageCount(unreadCount);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <header className="sticky top-0 z-50 bg-[#0B2E4E] shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="bg-amber-400 rounded-lg p-1.5 group-hover:bg-amber-300 transition-colors">
              <Waves size={20} className="text-[#0B2E4E]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SwimBlitz</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search swimmers by name..."
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              className="w-full rounded-lg bg-[#1a4a6e] text-white placeholder-blue-300 py-2 pl-10 pr-4 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-blue-300" />
          </div>

          {/* Nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/discovery')}
              className="px-4 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-[#1a4a6e] rounded-lg transition-all"
            >
              Scout Dashboard
            </button>

            <button
              onClick={() => setShowChatDropdown(!showChatDropdown)}
              className="relative p-2 rounded-lg text-blue-100 hover:text-white hover:bg-[#1a4a6e] transition-all"
            >
              <MessageSquare size={20} />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-[#0B2E4E] text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadMessageCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-[#1a4a6e] transition-all"
            >
              <User size={20} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-[#1a4a6e] transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Chat Dropdown */}
        {showChatDropdown && currentUser && (
          <div className="absolute right-4 mt-1 bg-white shadow-xl rounded-xl w-80 p-4 z-50 max-h-96 overflow-y-auto border border-blue-100">
            <h3 className="text-base font-semibold text-[#0B2E4E] mb-3">Messages</h3>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-all"
                  onClick={() => handleOpenChat(chat)}
                >
                  <div className="font-medium text-gray-800 text-sm">{chat.otherUserName}</div>
                  <div className="text-gray-500 text-xs truncate">{chat.lastMessage}</div>
                  {chat.unreadCount > 0 && (
                    <div className="text-xs text-amber-600 font-medium mt-0.5">{chat.unreadCount} new</div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No conversations yet</p>
            )}
          </div>
        )}

        {/* Search Results */}
        {showSearchResults && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 p-3 bg-white shadow-xl w-full max-w-md rounded-xl z-50 border border-blue-100">
            <div className="text-sm font-semibold mb-2 text-[#0B2E4E]">Search Results</div>
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-all gap-3"
                  onClick={() => handleSearchProfile(user.uid || user.id)}
                >
                  <div className="bg-[#0B2E4E] h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.type} · {user.state || 'India'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No swimmers found</div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default Header;
