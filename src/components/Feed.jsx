import React,  {useState, useEffect} from 'react';
import { collection, getDocs, query, limit } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { db } from './FireBase';
import { Heart, MessageCircle, Share, Play } from 'lucide-react';


function Feed() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [feedItems,setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(()=> {
        const fetchFeedData = async () => {
            try {
                setLoading(true);
                const userQuery = query(collection(db,"users"),limit(50));
                const usersSnapshot = await getDocs(userQuery);

                const allFeedItems = [];
                usersSnapshot.forEach((doc) => {
                    const userData = doc.data();
                    const userId = doc.id;
                    if (userData.photos && userData.photos.length > 0) {
                    userData.photos.forEach((photoObj, index) => {
                        const isObject = typeof photoObj === "object";
                        const url = isObject ? photoObj.url : photoObj;
                        const rawTimestamp = isObject ? photoObj.timestamp : null;

                        const timestamp = rawTimestamp
                            ? new Date(
                                rawTimestamp.seconds
                                    ? rawTimestamp.seconds * 1000
                                    : rawTimestamp
                              )
                            : new Date(); // fallback

                        allFeedItems.push({
                            id: `${userId}_photo_${index}`,
                            type: "photo",
                            url,
                            userId,
                            userName: userData.name || "Unknown User",
                            userAvatar:
                                userData.profile_pic ||
                                "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg",
                            userType: userData.type || "Athlete",
                            userSport: userData.sport || "",
                            timestamp,
                        });
                    });
                }

                // Handle Videos
                if (userData.videos && userData.videos.length > 0) {
                    userData.videos.forEach((videoObj, index) => {
                        const isObject = typeof videoObj === "object";
                        const url = isObject ? videoObj.url : videoObj;
                        const rawTimestamp = isObject ? videoObj.timestamp : null;

                        const timestamp = rawTimestamp
                            ? new Date(
                                rawTimestamp.seconds
                                    ? rawTimestamp.seconds * 1000
                                    : rawTimestamp
                              )
                            : new Date(); // fallback

                        allFeedItems.push({
                            id: `${userId}_video_${index}`,
                            type: "video",
                            url,
                            userId,
                            userName: userData.name || "Unknown User",
                            userAvatar:
                                userData.profile_pic ||
                                "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg",
                            userRole: userData.role || "Athlete",
                            userSport: userData.sport || "",
                            timestamp,
                        });
                    });
                }
                });

                allFeedItems.sort((a, b) => b.timestamp - a.timestamp);
                setFeedItems(allFeedItems);
            } catch (error) {
                console.error("Error fetching feed data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedData();
    },[]);

    const handleProfileClick = (userId) => {
        navigate(`/profile/${userId}`);
    }

    const handleChat = (userId) => {
        navigate(`/chat/${userId}`);
    }

    if(loading){
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header/>
                <div className="flex justify-center items-center flex-1">
                    <div className="text-xl text-gray-600">Loading Feed...</div>
                </div>
            </div>
        )
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
                <p className="text-sm text-gray-500">{item.userSport} • {item.userRole || item.userType}</p>
                <p className="text-sm text-gray-500">{item.timestamp.toLocaleString()}</p>
              </div>
              <div className="ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleChat(item.userId)}>
                  Message
                </Button>
                </div>
            </div>
            {item.type === 'photo' ? (
              <img src={item.url} alt="Feed post" className="w-full max-h-[500px] object-cover" />
            ) : (
              <video controls className="w-full max-h-[500px] object-contain bg-black">
                <source src={item.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex gap-4 text-gray-600">
                <Heart className="w-5 h-5 cursor-pointer hover:text-red-500" />
                <MessageCircle className="w-5 h-5 cursor-pointer hover:text-blue-500" />
                <Share className="w-5 h-5 cursor-pointer hover:text-green-500" />
              </div>
              {item.type === 'video' && (
                <Play className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  </div>
);
}

export default Feed
