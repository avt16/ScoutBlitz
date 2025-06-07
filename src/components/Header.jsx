import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Search, LogOut } from 'lucide-react';
import { collection, query, getDocs, where, doc, getDoc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from './FireBase';

function Header() {
  const [search, setSearch] = useState("");
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
      console.error("Logout failed:", error);
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
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("name", ">=", search),
          where("name", "<=", search + "\uf8ff")
        );
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSearchResults(users);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error fetching results: ", error);
        setSearchResults([]);
      }
    };

    const delayDebounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchProfile = (uid) => {
    navigate(`/profile/${uid}`);
    setShowSearchResults(false);
    setSearch("");
  };
  const markChatAsRead = async (chatId) => {
    if (!currentUser) return;
    
    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, "chats", chatId, "messages");
      const unreadMessagesQuery = query(
        messagesRef,
        where("read", "==", false),
        where("senderId", "!=", currentUser.uid)
      );
      
      const unreadMessages = await getDocs(unreadMessagesQuery);
      
      unreadMessages.forEach((messageDoc) => {
        const messageRef = doc(db, "chats", chatId, "messages", messageDoc.id);
        batch.update(messageRef, { read: true });
      });
      
      await batch.commit();
      
      // Note: The state update is now handled in handleOpenChat
      // This ensures immediate UI feedback while database updates happen asynchronously
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Navigate to chat and mark messages as read
  const handleOpenChat = (chat) => {
    // Mark chat as read in the database
    markChatAsRead(chat.id);
    
    // Immediately update local state to show 0 unread count
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      )
    );
    
    // Update the total unread count
    setUnreadMessageCount(prevCount => prevCount - chat.unreadCount);
    
    // Navigate to the chat page
    navigate(`/chat/${chat.otherUserId}`);
    setShowChatDropdown(false);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", user.uid)
        );
        const querySnapshot = await getDocs(q);
        let unreadCount = 0;
        const chatList = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const chatId = docSnap.id;
            const otherUserId = data.participants.find((id) => id !== user.uid);
            const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
            const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : {};
            const messagesSnapshot = await getDocs(
              query(collection(db, "chats", chatId, "messages"), where("read", "==", false))
            );
            unreadCount += messagesSnapshot.size;
            const lastMessage = data.messages && data.messages.length > 0 ? data.messages[data.messages.length - 1] : null;
            return {
              id: chatId,
              ...data,
              otherUserId,
              otherUserName: otherUser.name || "Unknown User",
              lastMessage: lastMessage ? lastMessage.text : "No messages yet",
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
      <header className="sticky top-0 z-50 bg-white shadow-sm transition-all ease-in-out duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className="text-2xl font-medium text-gray-800 cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
            onClick={() => navigate("/")}
          >
            Scout Blitz
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Search for users, coaches, teams..."
              onChange={handleSearch}
              value={search}
              className="w-full rounded-lg bg-gray-100 py-2 pl-10 pr-4 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 ease-in-out"
            />
            <div className="absolute left-3 top-2 text-gray-500">
              <Search size={20} />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button
            
            onClick={() => navigate("/discovery")}
            className='p-3 rounded-full text-gray-800 hover:bg-gray-100 transition-all duration-200 ease-in-out'
            >
             Discovery 
              {/*Change to an Icon Later */}
            </button>
            {/* Chat Button */}
            <button
              onClick={() => setShowChatDropdown(!showChatDropdown)}
              className="relative p-3 rounded-full text-gray-800 hover:bg-gray-100 transition-all duration-200 ease-in-out"
            >
              <MessageSquare size={24} />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessageCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-3 rounded-full text-gray-800 hover:bg-gray-100 transition-all duration-200 ease-in-out"
            >
              <LogOut size={20} />
            </button>

            {/* Profile Button */}
            <button
              onClick={() => navigate("/profile")}
              className="p-3 rounded-full text-gray-800 hover:bg-gray-100 transition-all duration-200 ease-in-out"
            >
              <User size={20} />
            </button>
          </div>
        </div>

        {/* Chat Dropdown */}
        {showChatDropdown && currentUser && (
          <div className="absolute right-4 mt-4 bg-white shadow-lg rounded-lg w-80 p-4 z-50 max-h-96 overflow-y-auto transition-all ease-in-out duration-300 opacity-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Chats</h3>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 ease-in-out"
                  onClick={()=>handleOpenChat(chat)}
                >
                  <div className="font-medium text-gray-800">{chat.otherUserName}</div>
                  <div className="text-gray-600 text-sm truncate">{chat.lastMessage}</div>
                  {chat.unreadCount > 0 && (
                    <div className="text-xs text-red-500 mt-1">
                      {chat.unreadCount} new messages
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No chats yet</p>
            )}
          </div>
        )}

        {/* Search Results */}
        {showSearchResults && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-4 bg-white shadow-lg w-full max-w-md rounded-lg z-50 transition-all duration-300 ease-in-out opacity-100">
            <div className="font-semibold mb-3 text-gray-800">Search Results</div>
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 ease-in-out"
                  onClick={() => handleSearchProfile(user.uid || user.id)}
                >
                  <div className="bg-gray-300 h-10 w-10 rounded-full flex items-center justify-center text-white text-xl">
                    {user.avatar || user.name?.charAt(0) || "U"}
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-800">{user.name}</p>
                    <p className="text-gray-500">{user.username}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No results found</div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default Header;