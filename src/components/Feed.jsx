// Feed.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  limit,
  doc,
  getDoc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { db } from './FireBase';
import { Heart, MessageCircle, Share, Play, X } from 'lucide-react';

function Feed() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true);
        const userQuery = query(collection(db, 'users'), limit(50));
        const usersSnapshot = await getDocs(userQuery);
        const allFeedItems = [];

        for (const docSnap of usersSnapshot.docs) {
          const userData = docSnap.data();
          const userId = docSnap.id;

          const processMedia = async (mediaArray, type) => {
            for (let index = 0; index < mediaArray.length; index++) {
              const mediaObj = mediaArray[index];
              const isObject = typeof mediaObj === 'object';
              const url = isObject ? mediaObj.url : mediaObj;
              const description = isObject ? mediaObj.description : '';
              const rawTimestamp = isObject ? mediaObj.timestamp : null;

              const timestamp = rawTimestamp
                ? new Date(
                    rawTimestamp.seconds
                      ? rawTimestamp.seconds * 1000
                      : rawTimestamp
                  )
                : new Date();

              const postId = `${userId}_${type}_${index}`;
              const likesDoc = await getDoc(doc(db, 'likes', postId));
              const likedBy = likesDoc.exists() ? likesDoc.data().likedBy || [] : [];

              allFeedItems.push({
                id: postId,
                type,
                url,
                description,
                userId,
                userName: userData.name || 'Unknown User',
                userAvatar:
                  userData.profile_pic ||
                  'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg',
                userType: userData.type || 'Athlete',
                userRole: userData.role || 'Athlete',
                userSport: userData.sport || '',
                timestamp,
                likedByCurrentUser: likedBy.includes(currentUser?.uid),
                likeCount: likedBy.length
              });
            }
          };

          if (userData.photos && userData.photos.length > 0) {
            await processMedia(userData.photos, 'photo');
          }

          if (userData.videos && userData.videos.length > 0) {
            await processMedia(userData.videos, 'video');
          }
        }

        allFeedItems.sort((a, b) => b.timestamp - a.timestamp);
        setFeedItems(allFeedItems);

        const fetchComments = async () => {
          const commentsData = {};
          for (const item of allFeedItems) {
            const commentSnapshot = await getDocs(collection(db, 'comments', item.id, 'messages'));
            commentsData[item.id] = commentSnapshot.docs.map((doc) => doc.data());
          }
          setComments(commentsData);
        };

        await fetchComments();
      } catch (error) {
        console.error('Error fetching feed data: ', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchFeedData();
  }, [currentUser]);

  const toggleLike = async (postId) => {
    if (!currentUser) return;

    const likesRef = doc(db, 'likes', postId);
    const likesDoc = await getDoc(likesRef);
    const data = likesDoc.exists() ? likesDoc.data() : { likedBy: [], count: 0 };
    const hasLiked = data.likedBy.includes(currentUser.uid);

    const newLikedBy = hasLiked
      ? data.likedBy.filter((uid) => uid !== currentUser.uid)
      : [...data.likedBy, currentUser.uid];

    await setDoc(likesRef, {
      likedBy: newLikedBy,
      count: newLikedBy.length
    });

    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === postId
          ? {
              ...item,
              likedByCurrentUser: !hasLiked,
              likeCount: hasLiked ? item.likeCount - 1 : item.likeCount + 1
            }
          : item
      )
    );
  };

  const handleCommentSubmit = async (postId) => {
    if (!currentUser || !newComment[postId]) return;

    const commentRef = collection(db, 'comments', postId, 'messages');
    await addDoc(commentRef, {
      text: newComment[postId],
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      timestamp: new Date()
    });

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), {
        text: newComment[postId],
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        timestamp: new Date()
      }]
    }));

    setNewComment((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // === New Sharing system ===
  const handleShare = (postId) => {
    // Create a URL to share — adjust this URL structure to your routing
    const shareUrl = `${window.location.origin}/post/${postId}`;
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Post link copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy link to clipboard.');
      });
    } else {
      alert('Clipboard not supported');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center flex-1">
          <div className="text-xl text-gray-600">Loading Feed...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 max-w-3xl mx-auto w-full">
        {feedItems.length === 0 ? (
          <div className="text-center text-gray-600 mt-12">No posts to display</div>
        ) : (
          feedItems.map((item) => (
            <Card key={item.id} className="mb-6 shadow-md rounded-2xl">
              <div className="flex items-center p-4 gap-4">
                <Avatar onClick={() => handleProfileClick(item.userId)} className="cursor-pointer">
                  <AvatarImage src={item.userAvatar} />
                  <AvatarFallback>{item.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{item.userName}</p>
                  <p className="text-sm text-gray-500">
                    {item.userSport} • {item.userRole || item.userType}
                  </p>
                  <p className="text-sm text-gray-500">{item.timestamp.toLocaleString()}</p>
                </div>
                <div className="ml-auto">
                  <Button size="sm" variant="outline" onClick={() => handleChat(item.userId)}>
                    Message
                  </Button>
                </div>
              </div>
              {item.type === 'photo' ? (
                <div 
                  className="cursor-pointer"
                  onClick={() => setSelectedImage(item.url)}
                >
                  <img 
                    src={item.url} 
                    alt="Feed post" 
                    className="w-full max-h-[500px] object-cover" 
                  />
                </div>
              ) : (
                <video controls className="w-full max-h-[500px] object-contain bg-black">
                  <source src={item.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              {item.description && (
                <div className="px-4 py-2 text-gray-700">
                  <p>{item.description}</p>
                </div>
              )}
              <div className="flex justify-between items-center px-4 py-3">
                <div className="flex gap-4 text-gray-600 items-center">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-red-500"
                    onClick={() => toggleLike(item.id)}
                  >
                    <Heart
                      className={`w-5 h-5 ${item.likedByCurrentUser ? 'text-red-500 fill-current' : ''}`}
                    />
                    <span className="text-sm">{item.likeCount}</span>
                  </div>
                  <MessageCircle className="w-5 h-5 cursor-pointer hover:text-blue-500" onClick={() => toggleComments(item.id)} />
                  <Share
                    className="w-5 h-5 cursor-pointer hover:text-green-500"
                    onClick={() => handleShare(item.id)}
                  />
                </div>
                {item.type === 'video' && <Play className="w-5 h-5 text-gray-500" />}
              </div>
              {showComments[item.id] && (
                <div className="px-4 pb-4">
                  <div className="space-y-1">
                    {(comments[item.id] || []).map((comment, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        <span className="font-semibold mr-1">{comment.authorName}:</span>
                        {comment.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2 gap-2">
                    <input
                      type="text"
                      value={newComment[item.id] || ''}
                      onChange={(e) =>
                        setNewComment((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="flex-1 border rounded-lg px-3 py-1 text-sm"
                      placeholder="Write a comment..."
                    />
                    <Button size="sm" onClick={() => handleCommentSubmit(item.id)}>Post</Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <div className="max-w-[90vw] max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full size preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;
