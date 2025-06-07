import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Header from './Header';
import { IoCamera } from "react-icons/io5";
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from './ui/button';
import { db, storage } from './FireBase';
import { ref,uploadBytes, getDownloadURL} from "firebase/storage";
import { CgSoftwareUpload } from "react-icons/cg";

export default function Profile({ isMyProfile }) {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        type: "",
        name: "",
        bio: "",
        gender: "",
        nationality: "",
        height: "",
        weight: "",
        profile_pic: "",
        age: "",
        sport: "",
        footballGamesPlayed: "",
        footballGamesStarted: "",
        footballGoalsScored: "",
        footballAssistsMade: "",
        basketballGamesPlayed: "",
        basketballGamesStarted: "",
        basketballPointsPerGame: "",
        basketballAssistsPerGame: "",
        basketballDefensiveReboundsPerGame: "",
        basketballOffensiveReboundsPerGame: "",
        basketballTotalReboundsPerGame: "",
        basketballStealsPerGame: "",
        basketballBlocksPerGame: "",
        basketballTurnoversPerGame: "",
        running60mSprintTime: "",
        running100mSprintTime: "",
        running200mSprintTime: "",
        running400mRunTime: "",
        running800mRunTime: "",
        running1000mTrackRunTime: "",
        running1500mTrackRunTime: "",
        running1MileTrackRunTime: "",
        running2000mTrackRunTime: "",
        running3000mTrackRunTime: "",
        running5000mTrackRunTime: "",
        running10000mTrackRunTime: "",
        running3kmRoadRunTime: "",
        running5kmRoadRunTime: "",
        running10kmRoadRunTime: "",
        runningHalfMarathonRunTime: "",
        runningMarathonRunTime: "",
        running50kmRoadRunTime: "",
        running100kmRoadRunTime: "",
        running60mHurdlesRunTime: "",
        running110mHurdlesRunTime: "",
        running400mHurdlesRunTime: "",
        running3000mSteeplechaseRunTime: "",
        swimming50mFreestyleTime: "",
        swimming100mFreestyleTime: "",
        swimming200mFreestyleTime: "",
        swimming400mFreestyleTime: "",
        swimming800mFreestyleTime: "",
        swimming1500mFreestyleTime: "",
        swimming50mBackstrokeTime: "",
        swimming100mBackstrokeTime: "",
        swimming200mBackstrokeTime: "",
        swimming50mBreaststrokeTime: "",
        swimming100mBreaststrokeTime: "",
        swimming200mBreaststrokeTime: "",
        swimming50mButterflyTime: "",
        swimming100mButterflyTime: "",
        swimming200mButterflyTime: "",
        swimming100mIndividualMedleyTime: "",
        swimming200mIndividualMedleyTime: "",
        swimming400mIndividualMedleyTime: "",
        swimming5kmOpenWaterTime: "",
        swimming75kmOpenWaterTime: "",
        swimming10kmOpenWaterTime: "",
        swimming25kmOpenWaterTime: "",
        photos: [],
        videos: []
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const uid = isMyProfile ? user?.uid : userId;
            if (!uid) return;
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    email: data.email || "",
                    type: data.type || "",
                    name: data.name || "",
                    bio: data.bio || "",
                    gender: data.gender || "",
                    nationality: data.nationality || "",
                    height: data.height || "",
                    weight: data.weight || "",
                    profile_pic: data.profile_pic || "",
                    age: data.age || "",
                    sport: data.sport || "",
                    footballGamesPlayed: data.footballGamesPlayed || "",
                    footballGamesStarted: data.footballGamesStarted || "",
                    footballGoalsScored: data.footballGoalsScored || "",
                    footballAssistsMade: data.footballAssistsMade || "",
                    basketballGamesPlayed: data.basketballGamesPlayed || "",
                    basketballGamesStarted: data.basketballGamesStarted || "",
                    basketballPointsPerGame: data.basketballPointsPerGame || "",
                    basketballAssistsPerGame: data.basketballAssistsPerGame || "",
                    basketballDefensiveReboundsPerGame: data.basketballDefensiveReboundsPerGame || "",
                    basketballOffensiveReboundsPerGame: data.basketballOffensiveReboundsPerGame || "",
                    basketballTotalReboundsPerGame: data.basketballTotalReboundsPerGame || "",
                    basketballStealsPerGame: data.basketballStealsPerGame || "",
                    basketballBlocksPerGame: data.basketballBlocksPerGame || "",
                    basketballTurnoversPerGame: data.basketballTurnoversPerGame || "",
                    running60mSprintTime: data.running60mSprintTime || "",
                    running100mSprintTime: data.running100mSprintTime || "",
                    running200mSprintTime: data.running200mSprintTime || "",
                    running400mRunTime: data.running400mRunTime || "",
                    running800mRunTime: data.running800mRunTime || "",
                    running1000mTrackRunTime: data.running1000mTrackRunTime || "",
                    running1500mTrackRunTime: data.running1500mTrackRunTime || "",
                    running1MileTrackRunTime: data.running1MileTrackRunTime || "",
                    running2000mTrackRunTime: data.running2000mTrackRunTime || "",
                    running3000mTrackRunTime: data.running3000mTrackRunTime || "",
                    running5000mTrackRunTime: data.running5000mTrackRunTime || "",
                    running10000mTrackRunTime: data.running10000mTrackRunTime || "",
                    running3kmRoadRunTime: data.running3kmRoadRunTime || "",
                    running5kmRoadRunTime: data.running5kmRoadRunTime || "",
                    running10kmRoadRunTime: data.running10kmRoadRunTime || "",
                    runningHalfMarathonRunTime: data.runningHalfMarathonRunTime || "",
                    runningMarathonRunTime: data.runningMarathonRunTime || "",
                    running50kmRoadRunTime: data.running50kmRoadRunTime || "",
                    running100kmRoadRunTime: data.running100kmRoadRunTime || "",
                    running60mHurdlesRunTime: data.running60mHurdlesRunTime || "",
                    running110mHurdlesRunTime: data.running110mHurdlesRunTime || "",
                    running400mHurdlesRunTime: data.running400mHurdlesRunTime || "",
                    running3000mSteeplechaseRunTime: data.running3000mSteeplechaseRunTime || "",
                    swimming50mFreestyleTime: data.swimming50mFreestyleTime || "",
                    swimming100mFreestyleTime: data.swimming100mFreestyleTime || "",
                    swimming200mFreestyleTime: data.swimming200mFreestyleTime || "",
                    swimming400mFreestyleTime: data.swimming400mFreestyleTime || "",
                    swimming800mFreestyleTime: data.swimming800mFreestyleTime || "",
                    swimming1500mFreestyleTime: data.swimming1500mFreestyleTime || "",
                    swimming50mBackstrokeTime: data.swimming50mBackstrokeTime || "",
                    swimming100mBackstrokeTime: data.swimming100mBackstrokeTime || "",
                    swimming200mBackstrokeTime: data.swimming200mBackstrokeTime || "",
                    swimming50mBreaststrokeTime: data.swimming50mBreaststrokeTime || "",
                    swimming100mBreaststrokeTime: data.swimming100mBreaststrokeTime || "",
                    swimming200mBreaststrokeTime: data.swimming200mBreaststrokeTime || "",
                    swimming50mButterflyTime: data.swimming50mButterflyTime || "",
                    swimming100mButterflyTime: data.swimming100mButterflyTime || "",
                    swimming200mButterflyTime: data.swimming200mButterflyTime || "",
                    swimming100mIndividualMedleyTime: data.swimming100mIndividualMedleyTime || "",
                    swimming200mIndividualMedleyTime: data.swimming200mIndividualMedleyTime || "",
                    swimming400mIndividualMedleyTime: data.swimming400mIndividualMedleyTime || "",
                    swimming5kmOpenWaterTime: data.swimming5kmOpenWaterTime || "",
                    swimming75kmOpenWaterTime: data.swimming75kmOpenWaterTime || "",
                    swimming10kmOpenWaterTime: data.swimming10kmOpenWaterTime || "",
                    swimming25kmOpenWaterTime: data.swimming25kmOpenWaterTime || "",
                    photos: data.photos || [],
                    videos: data.videos || []
                });
            } else if (isMyProfile && user) {
                setFormData(prev => ({
                    ...prev,
                    email: user.email || "",
                    type: user.type || "",
                    name: user.displayName || ""
                }));
            }
        };
        if ((isMyProfile && user) || (!isMyProfile && userId)) fetchUser();
    }, [user, userId, isMyProfile]);

    const saveProfile = async () => {
        if (!user || !user.uid) {
            console.error("User not authenticated");
            return;
        }

        const docRef = doc(db, "users", user.uid);

        const profileData = {
            type: formData.type,
            name: formData.name,
            bio: formData.bio,
            gender: formData.gender,
            nationality: formData.nationality,
            height: formData.height,
            weight: formData.weight,
            profile_pic: formData.profile_pic,
            age: formData.age,
            sport: formData.sport,
            footballGamesPlayed: formData.footballGamesPlayed,
            footballGamesStarted: formData.footballGamesStarted,
            footballGoalsScored: formData.footballGoalsScored,
            footballAssistsMade: formData.footballAssistsMade,
            basketballGamesPlayed: formData.basketballGamesPlayed,
            basketballGamesStarted: formData.basketballGamesStarted,
            basketballPointsPerGame: formData.basketballPointsPerGame,
            basketballAssistsPerGame: formData.basketballAssistsPerGame,
            basketballDefensiveReboundsPerGame: formData.basketballDefensiveReboundsPerGame,
            basketballOffensiveReboundsPerGame: formData.basketballOffensiveReboundsPerGame,
            basketballTotalReboundsPerGame: formData.basketballTotalReboundsPerGame,
            basketballStealsPerGame: formData.basketballStealsPerGame,
            basketballBlocksPerGame: formData.basketballBlocksPerGame,
            basketballTurnoversPerGame: formData.basketballTurnoversPerGame,
            running60mSprintTime: formData.running60mSprintTime,
            running100mSprintTime: formData.running100mSprintTime,
            running200mSprintTime: formData.running200mSprintTime,
            running400mRunTime: formData.running400mRunTime,
            running800mRunTime: formData.running800mRunTime,
            running1000mTrackRunTime: formData.running1000mTrackRunTime,
            running1500mTrackRunTime: formData.running1500mTrackRunTime,
            running1MileTrackRunTime: formData.running1MileTrackRunTime,
            running2000mTrackRunTime: formData.running2000mTrackRunTime,
            running3000mTrackRunTime: formData.running3000mTrackRunTime,
            running5000mTrackRunTime: formData.running5000mTrackRunTime,
            running10000mTrackRunTime: formData.running10000mTrackRunTime,
            running3kmRoadRunTime: formData.running3kmRoadRunTime,
            running5kmRoadRunTime: formData.running5kmRoadRunTime,
            running10kmRoadRunTime: formData.running10kmRoadRunTime,
            runningHalfMarathonRunTime: formData.runningHalfMarathonRunTime,
            runningMarathonRunTime: formData.runningMarathonRunTime,
            running50kmRoadRunTime: formData.running50kmRoadRunTime,
            running100kmRoadRunTime: formData.running100kmRoadRunTime,
            running60mHurdlesRunTime: formData.running60mHurdlesRunTime,
            running110mHurdlesRunTime: formData.running110mHurdlesRunTime,
            running400mHurdlesRunTime: formData.running400mHurdlesRunTime,
            running3000mSteeplechaseRunTime: formData.running3000mSteeplechaseRunTime,
            swimming50mFreestyleTime: formData.swimming50mFreestyleTime,
            swimming100mFreestyleTime: formData.swimming100mFreestyleTime,
            swimming200mFreestyleTime: formData.swimming200mFreestyleTime,
            swimming400mFreestyleTime: formData.swimming400mFreestyleTime,
            swimming800mFreestyleTime: formData.swimming800mFreestyleTime,
            swimming1500mFreestyleTime: formData.swimming1500mFreestyleTime,
            swimming50mBackstrokeTime: formData.swimming50mBackstrokeTime,
            swimming100mBackstrokeTime: formData.swimming100mBackstrokeTime,
            swimming200mBackstrokeTime: formData.swimming200mBackstrokeTime,
            swimming50mBreaststrokeTime: formData.swimming50mBreaststrokeTime,
            swimming100mBreaststrokeTime: formData.swimming100mBreaststrokeTime,
            swimming200mBreaststrokeTime: formData.swimming200mBreaststrokeTime,
            swimming50mButterflyTime: formData.swimming50mButterflyTime,
            swimming100mButterflyTime: formData.swimming100mButterflyTime,
            swimming200mButterflyTime: formData.swimming200mButterflyTime,
            swimming100mIndividualMedleyTime: formData.swimming100mIndividualMedleyTime,
            swimming200mIndividualMedleyTime: formData.swimming200mIndividualMedleyTime,
            swimming400mIndividualMedleyTime: formData.swimming400mIndividualMedleyTime,
            swimming5kmOpenWaterTime: formData.swimming5kmOpenWaterTime,
            swimming75kmOpenWaterTime: formData.swimming75kmOpenWaterTime,
            swimming10kmOpenWaterTime: formData.swimming10kmOpenWaterTime,
            swimming25kmOpenWaterTime: formData.swimming25kmOpenWaterTime,
            email: user.email, // Make sure email is saved too
            photos: formData.photos || [],
            videos: formData.videos || []
        };

        await setDoc(docRef, profileData, {merge:true});
        setEditing(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profile_pic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMediaUpload = async(e,type) => {
        const files = Array.from(e.target.files);
        if(!user.uid || files.length === 0) return;
        setUploading(true);
        const uploadedItems = [];
        for (const file of files) {
            const fileRef = ref(storage,`users/${user.uid}/${type}/${file.name}`)
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            uploadedItems.push({
                url,
                timestamp: new Date().toISOString(),
            });
        }
        setFormData((prev)=> ({
            ...prev,
            [type]: [...(prev[type] || []), ...uploadedItems]
        }));
        setUploading(false);
    }

    if (!user) return <p className="text-center mt-10">Please log in to view your profile.</p>;

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
            <Header />
            <div className="flex flex-col items-center gap-8 pt-12 pb-16 px-6">
                {/* Profile Card */}
                <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl bg-opacity-90 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className="w-32 h-32 border-8 border-indigo-600 rounded-full transition-all transform hover:scale-110">
                                <AvatarImage
                                    src={formData.profile_pic || "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"}
                                    alt="profile"
                                />
                                <AvatarFallback>{formData.name?.[0]}</AvatarFallback>
                            </Avatar>
                            {isMyProfile && (
                                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer shadow-md hover:scale-110 transition-all">
                                    <IoCamera className="text-xl" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>
    
                        {/* Profile Information */}
                        <div className="w-full space-y-6">
                            <div className="text-center">
                                <h2 className="text-3xl font-semibold text-indigo-800">{formData.name}</h2>
                                <p className="text-lg text-gray-600">{formData.type || 'Athlete'}</p>
                            </div>
    
                            {/* Input Fields */}
                            <div className="flex flex-col space-y-6">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        disabled={!editing}
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Age"
                                    />
                                    <input
                                        type="text"
                                        disabled={!editing}
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Height"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        disabled={!editing}
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Weight"
                                    />
                                    <input
                                        type="text"
                                        disabled={!editing}
                                        value={formData.nationality}
                                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                        className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Nationality"
                                    />
                                </div>
                                <textarea
                                    disabled={!editing}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Bio"
                                />
                                <select
                                    disabled={!editing}
                                    value={formData.sport}
                                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                                    className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Select Sport</option>
                                    <option value="Swimming">Swimming</option>
                                    <option value="Running">Running</option>
                                    <option value="Basketball">Basketball</option>
                                    <option value="Football">Football</option>
                                </select>
                                <select
                                    disabled={!editing}
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full p-5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            <div className='mt-4'>
                                {isMyProfile && editing && (
                                    <>
                                        {/* <div className='flex flex-row gap-2 items-center text-center'>
                                            <label className="block mb-2 font-semibold"> Upload Photos</label>
                                            <CgSoftwareUpload size={23} />
                                        </div>
                                        <input type="file" accept='image/*' multiple onChange={(e)=> handleMediaUpload(e,'photos')} disabled={uploading} style={{ display: 'none' }}/> */}
                                        <div>
                                            <label htmlFor="photo-upload" className="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline">
                                              <CgSoftwareUpload size={24} />
                                              <span className="font-medium">Upload Photos</span>
                                            </label>
                                            <input
                                              id="photo-upload"
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              onChange={(e) => handleMediaUpload(e, 'photos')}
                                              disabled={uploading}
                                              className="hidden"
                                            />
                                        </div>

                                        {/* <label className="block mb-2 font-semibold"> Upload Videos</label>
                                        <input type="file" accept='video/*' multiple onChange={(e)=> handleMediaUpload(e,'videos')} disabled={uploading} style={{ display: 'none' }}/> */}
                                        <div>
                                            <label htmlFor="video-upload" className="flex items-center gap-2 cursor-pointer text-purple-600 hover:underline">
                                              <CgSoftwareUpload size={24} />
                                              <span className="font-medium">Upload Videos</span>
                                            </label>
                                            <input
                                              id="video-upload"
                                              type="file"
                                              accept="video/*"
                                              multiple
                                              onChange={(e) => handleMediaUpload(e, 'videos')}
                                              disabled={uploading}
                                              className="hidden"
                                            />
                                        </div>
                                        {uploading && <div className="text-blue-500 mt-2">Uploading...</div>}
                                    </>
                                )}
                                {/* {formData.photos && formData.photos.length > 0 && (
                                    <div className="mt-4">
                                        <div className="font-semibold mb-2"> Photos: </div>
                                        <div>
                                            {formData.photos.map((url,idx)=> (
                                                <img key={idx} src={url} alt="uploaded" className="w-24 h-24 object-cover rounded-lg border"/>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {formData.videos && formData.videos.length > 0 && (
                                    <div className="mt-4">
                                        <div className="font-semibold mb-2"> Videos: </div>
                                        <div>
                                            {formData.videos.map((url,idx)=> (
                                                <video key={idx} src={url} controls className="w-24 h-24 object-cover rounded-lg border"/>
                                            ))}
                                        </div>
                                    </div>
                                )} */}
                            
                                </div>
                            </div>
                        </div>
    
                        {/* Buttons */}
                        <div className="flex justify-between w-full">
                            {isMyProfile && (
                                <Button onClick={() => (editing ? saveProfile() : setEditing(true))} className="transition-all hover:bg-indigo-700 text-white">
                                    {editing ? "Save" : "Edit Profile"}
                                </Button>
                            )}
                            {!isMyProfile && user && (
                                <Button onClick={() => navigate(`/chat/${userId}`)} className="transition-all hover:bg-pink-600 text-white">
                                    Chat
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                    

                {/* Football Stats Card */}
                {formData.sport === "Football" && (
                    <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl bg-opacity-90 backdrop-blur-md mt-6">
                        <h3 className="text-2xl font-semibold text-center text-indigo-600 mb-6">Football Stats</h3>
                        
                        <div className="space-y-6">
                            {/* Position Picker */}
                            <div className="flex flex-col space-y-4">
                                {/* Primary Position */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Primary Position</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["Forward", "Midfielder", "Defender", "Goalkeeper"].map((position) => (
                                            <button
                                                key={position}
                                                onClick={() => setFormData({
                                                    ...formData, 
                                                    primaryPosition: formData.primaryPosition === position ? null : position
                                                })}
                                                className={`px-4 py-2 rounded-lg border transition-all duration-200 ease-in-out transform hover:scale-105 ${formData.primaryPosition === position ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 hover:bg-indigo-50'}`}
                                                disabled={!editing} // Disable if not in edit mode
                                            >
                                                {position}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Secondary Position */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Secondary Position</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["Forward", "Midfielder", "Defender", "Goalkeeper"].map((position) => (
                                            <button
                                                key={position}
                                                onClick={() => setFormData({
                                                    ...formData, 
                                                    secondaryPosition: formData.secondaryPosition === position ? null : position
                                                })}
                                                className={`px-4 py-2 rounded-lg border transition-all duration-200 ease-in-out transform hover:scale-105 ${formData.secondaryPosition === position ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 hover:bg-indigo-50'}`}
                                                disabled={formData.primaryPosition === position || !editing} // Disable if same as primary or not in edit mode
                                            >
                                                {position}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Football Stats Inputs */}
                            <div className="flex flex-col space-y-4">
                                {/* Games Played */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Games Played</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.footballGamesPlayed}
                                        onChange={(e) => setFormData({ ...formData, footballGamesPlayed: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter number of games"
                                    />
                                    {formData.footballGamesPlayed && (
                                        <p className="text-sm text-gray-500">Games Played: {formData.footballGamesPlayed}</p>
                                    )}
                                </div>

                                {/* Games Started */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Games Started</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.footballGamesStarted}
                                        onChange={(e) => setFormData({ ...formData, footballGamesStarted: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter number of games started"
                                    />
                                    {formData.footballGamesStarted && (
                                        <p className="text-sm text-gray-500">Games Started: {formData.footballGamesStarted}</p>
                                    )}
                                </div>

                                {/* Goals Scored */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Goals Scored</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.footballGoalsScored}
                                        onChange={(e) => setFormData({ ...formData, footballGoalsScored: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter number of goals scored"
                                    />
                                    {formData.footballGoalsScored && (
                                        <p className="text-sm text-gray-500">Goals Scored: {formData.footballGoalsScored}</p>
                                    )}
                                </div>

                                {/* Assists Made */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Assists Made</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.footballAssistsMade}
                                        onChange={(e) => setFormData({ ...formData, footballAssistsMade: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter number of assists made"
                                    />
                                    {formData.footballAssistsMade && (
                                        <p className="text-sm text-gray-500">Assists Made: {formData.footballAssistsMade}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Basketball Stats Card */}
                {formData.sport === "Basketball" && (
                    <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl bg-opacity-90 backdrop-blur-md mt-6">
                        <h3 className="text-2xl font-semibold text-center text-indigo-600 mb-6">Basketball Stats</h3>
                        
                        <div className="space-y-6">
                            {/* Basketball Stats Inputs */}
                            <div className="flex flex-col space-y-4">
                                {/* Games Played */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Games Played</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballGamesPlayed}
                                        onChange={(e) => setFormData({ ...formData, basketballGamesPlayed: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter number of games played"
                                    />
                                    {formData.basketballGamesPlayed && (
                                        <p className="text-sm text-gray-500">Games Played: {formData.basketballGamesPlayed}</p>
                                    )}
                                </div>

                                {/* Games Started */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Games Started</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballGamesStarted}
                                        onChange={(e) => setFormData({ ...formData, basketballGamesStarted: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter number of games started"
                                    />
                                    {formData.basketballGamesStarted && (
                                        <p className="text-sm text-gray-500">Games Started: {formData.basketballGamesStarted}</p>
                                    )}
                                </div>

                                {/* Points Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Points Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballPointsPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballPointsPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter points per game"
                                    />
                                    {formData.basketballPointsPerGame && (
                                        <p className="text-sm text-gray-500">Points Per Game: {formData.basketballPointsPerGame}</p>
                                    )}
                                </div>

                                {/* Assists Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Assists Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballAssistsPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballAssistsPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter assists per game"
                                    />
                                    {formData.basketballAssistsPerGame && (
                                        <p className="text-sm text-gray-500">Assists Per Game: {formData.basketballAssistsPerGame}</p>
                                    )}
                                </div>

                                {/* Defensive Rebounds Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Defensive Rebounds Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballDefensiveReboundsPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballDefensiveReboundsPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter defensive rebounds per game"
                                    />
                                    {formData.basketballDefensiveReboundsPerGame && (
                                        <p className="text-sm text-gray-500">Defensive Rebounds Per Game: {formData.basketballDefensiveReboundsPerGame}</p>
                                    )}
                                </div>

                                {/* Offensive Rebounds Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Offensive Rebounds Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballOffensiveReboundsPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballOffensiveReboundsPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter offensive rebounds per game"
                                    />
                                    {formData.basketballOffensiveReboundsPerGame && (
                                        <p className="text-sm text-gray-500">Offensive Rebounds Per Game: {formData.basketballOffensiveReboundsPerGame}</p>
                                    )}
                                </div>

                                {/* Steals Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Steals Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballStealsPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballStealsPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter steals per game"
                                    />
                                    {formData.basketballStealsPerGame && (
                                        <p className="text-sm text-gray-500">Steals Per Game: {formData.basketballStealsPerGame}</p>
                                    )}
                                </div>

                                {/* Blocks Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Blocks Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballBlocksPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballBlocksPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter blocks per game"
                                    />
                                    {formData.basketballBlocksPerGame && (
                                        <p className="text-sm text-gray-500">Blocks Per Game: {formData.basketballBlocksPerGame}</p>
                                    )}
                                </div>

                                {/* Turnovers Per Game */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm text-gray-600">Turnovers Per Game</label>
                                    <input
                                        type="number"
                                        disabled={!editing} // Only editable if in edit mode
                                        value={formData.basketballTurnoversPerGame}
                                        onChange={(e) => setFormData({ ...formData, basketballTurnoversPerGame: e.target.value })}
                                        className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                                        placeholder="Enter turnovers per game"
                                    />
                                    {formData.basketballTurnoversPerGame && (
                                        <p className="text-sm text-gray-500">Turnovers Per Game: {formData.basketballTurnoversPerGame}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Running Stats Card */}
                {formData.sport === "Running" && (
                <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl bg-opacity-90 backdrop-blur-md mt-6">
                    <h3 className="text-2xl font-semibold text-center text-indigo-600 mb-6">Running Stats</h3>

                    <div className="space-y-6">
                    {/* Running Stats Inputs */}
                    <div className="flex flex-col space-y-4">

                        {/* 60m Sprint Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">60m Sprint Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running60mSprintTime}
                            onChange={(e) => setFormData({ ...formData, running60mSprintTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 60m sprint"
                        />
                        {formData.running60mSprintTime && (
                            <p className="text-sm text-gray-500">60m Sprint Time: {formData.running60mSprintTime}</p>
                        )}
                        </div>

                        {/* 100m Sprint Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">100m Sprint Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running100mSprintTime}
                            onChange={(e) => setFormData({ ...formData, running100mSprintTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 100m sprint"
                        />
                        {formData.running100mSprintTime && (
                            <p className="text-sm text-gray-500">100m Sprint Time: {formData.running100mSprintTime}</p>
                        )}
                        </div>

                        {/* 200m Sprint Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">200m Sprint Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running200mSprintTime}
                            onChange={(e) => setFormData({ ...formData, running200mSprintTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 200m sprint"
                        />
                        {formData.running200mSprintTime && (
                            <p className="text-sm text-gray-500">200m Sprint Time: {formData.running200mSprintTime}</p>
                        )}
                        </div>

                        {/* 400m Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">400m Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running400mRunTime}
                            onChange={(e) => setFormData({ ...formData, running400mRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 400m run"
                        />
                        {formData.running400mRunTime && (
                            <p className="text-sm text-gray-500">400m Run Time: {formData.running400mRunTime}</p>
                        )}
                        </div>

                        {/* 800m Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">800m Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running800mRunTime}
                            onChange={(e) => setFormData({ ...formData, running800mRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 800m run"
                        />
                        {formData.running800mRunTime && (
                            <p className="text-sm text-gray-500">800m Run Time: {formData.running800mRunTime}</p>
                        )}
                        </div>

                        {/* 1000m Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">1000m Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running1000mTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running1000mTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 1000m track run"
                        />
                        {formData.running1000mTrackRunTime && (
                            <p className="text-sm text-gray-500">1000m Track Run Time: {formData.running1000mTrackRunTime}</p>
                        )}
                        </div>

                        {/* 1500m Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">1500m Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running1500mTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running1500mTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 1500m track run"
                        />
                        {formData.running1500mTrackRunTime && (
                            <p className="text-sm text-gray-500">1500m Track Run Time: {formData.running1500mTrackRunTime}</p>
                        )}
                        </div>

                        {/* 1 Mile Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">1 Mile Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running1MileTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running1MileTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 1 mile track run"
                        />
                        {formData.running1MileTrackRunTime && (
                            <p className="text-sm text-gray-500">1 Mile Track Run Time: {formData.running1MileTrackRunTime}</p>
                        )}
                        </div>

                        {/* 2000m Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">2000m Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running2000mTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running2000mTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 2000m track run"
                        />
                        {formData.running2000mTrackRunTime && (
                            <p className="text-sm text-gray-500">2000m Track Run Time: {formData.running2000mTrackRunTime}</p>
                        )}
                        </div>

                        {/* 3000m Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">3000m Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running3000mTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running3000mTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 3000m track run"
                        />
                        {formData.running3000mTrackRunTime && (
                            <p className="text-sm text-gray-500">3000m Track Run Time: {formData.running3000mTrackRunTime}</p>
                        )}
                        </div>

                        {/* 5000m Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">5000m Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running5000mTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running5000mTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 5000m track run"
                        />
                        {formData.running5000mTrackRunTime && (
                            <p className="text-sm text-gray-500">5000m Track Run Time: {formData.running5000mTrackRunTime}</p>
                        )}
                        </div>

                        {/* 10000m Track Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">10000m Track Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running10000mTrackRunTime}
                            onChange={(e) => setFormData({ ...formData, running10000mTrackRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 10000m track run"
                        />
                        {formData.running10000mTrackRunTime && (
                            <p className="text-sm text-gray-500">10000m Track Run Time: {formData.running10000mTrackRunTime}</p>
                        )}
                        </div>

                        {/* 3km Road Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">3km Road Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running3kmRoadRunTime}
                            onChange={(e) => setFormData({ ...formData, running3kmRoadRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 3km road run"
                        />
                        {formData.running3kmRoadRunTime && (
                            <p className="text-sm text-gray-500">3km Road Run Time: {formData.running3kmRoadRunTime}</p>
                        )}
                        </div>
                                {/* 5km Road Run Time */}
                                <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">5km Road Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running5kmRoadRunTime}
                            onChange={(e) => setFormData({ ...formData, running5kmRoadRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 5km road run"
                        />
                        {formData.running5kmRoadRunTime && (
                            <p className="text-sm text-gray-500">5km Road Run Time: {formData.running5kmRoadRunTime}</p>
                        )}
                        </div>

                        {/* 10km Road Run Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">10km Road Run Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.running10kmRoadRunTime}
                            onChange={(e) => setFormData({ ...formData, running10kmRoadRunTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 10km road run"
                        />
                        {formData.running10kmRoadRunTime && (
                            <p className="text-sm text-gray-500">10km Road Run Time: {formData.running10kmRoadRunTime}</p>
                        )}
                        </div>

                        {/* Half Marathon Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">Half Marathon Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.runningHalfMarathonTime}
                            onChange={(e) => setFormData({ ...formData, runningHalfMarathonTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for half marathon"
                        />
                        {formData.runningHalfMarathonTime && (
                            <p className="text-sm text-gray-500">Half Marathon Time: {formData.runningHalfMarathonTime}</p>
                        )}
                        </div>

                        {/* Full Marathon Time */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">Full Marathon Time</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.runningFullMarathonTime}
                            onChange={(e) => setFormData({ ...formData, runningFullMarathonTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for full marathon"
                        />
                        {formData.runningFullMarathonTime && (
                            <p className="text-sm text-gray-500">Full Marathon Time: {formData.runningFullMarathonTime}</p>
                        )}
                        </div>

                        {/* Ultramarathon Distance */}
                        <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-600">Ultramarathon Distance</label>
                        <input
                            type="text"
                            disabled={!editing}
                            value={formData.runningUltramarathonDistance}
                            onChange={(e) => setFormData({ ...formData, runningUltramarathonDistance: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter distance completed in ultramarathon"
                        />
                        {formData.runningUltramarathonDistance && (
                            <p className="text-sm text-gray-500">Ultramarathon Distance: {formData.runningUltramarathonDistance}</p>
                        )}
                        </div>

                    </div>
                    </div>
                </div>
                )}
                
                {/* Swimming Stats Card */}
                {formData.sport === "Swimming" && (
                <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl bg-opacity-90 backdrop-blur-md mt-6">
                    <h3 className="text-2xl font-semibold text-center text-indigo-600 mb-6">Swimming Stats</h3>
                    <div className="space-y-6">
                        {/* 50m Freestyle Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">50m Freestyle Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming50mFreestyleTime}
                            onChange={(e) => setFormData({ ...formData, swimming50mFreestyleTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 50m freestyle"
                            />
                            {formData.swimming50mFreestyleTime && (
                            <p className="text-sm text-gray-500">50m Freestyle Time: {formData.swimming50mFreestyleTime}</p>
                            )}
                        </div>

                        {/* 100m Freestyle Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">100m Freestyle Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming100mFreestyleTime}
                            onChange={(e) => setFormData({ ...formData, swimming100mFreestyleTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 100m freestyle"
                            />
                            {formData.swimming100mFreestyleTime && (
                            <p className="text-sm text-gray-500">100m Freestyle Time: {formData.swimming100mFreestyleTime}</p>
                            )}
                        </div>

                        {/* 200m Freestyle Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">200m Freestyle Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming200mFreestyleTime}
                            onChange={(e) => setFormData({ ...formData, swimming200mFreestyleTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 200m freestyle"
                            />
                            {formData.swimming200mFreestyleTime && (
                            <p className="text-sm text-gray-500">200m Freestyle Time: {formData.swimming200mFreestyleTime}</p>
                            )}
                        </div>

                        {/* 400m Freestyle Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">400m Freestyle Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming400mFreestyleTime}
                            onChange={(e) => setFormData({ ...formData, swimming400mFreestyleTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 400m freestyle"
                            />
                            {formData.swimming400mFreestyleTime && (
                            <p className="text-sm text-gray-500">400m Freestyle Time: {formData.swimming400mFreestyleTime}</p>
                            )}
                        </div>

                        {/* 800m Freestyle Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">800m Freestyle Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming800mFreestyleTime}
                            onChange={(e) => setFormData({ ...formData, swimming800mFreestyleTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 800m freestyle"
                            />
                            {formData.swimming800mFreestyleTime && (
                            <p className="text-sm text-gray-500">800m Freestyle Time: {formData.swimming800mFreestyleTime}</p>
                            )}
                        </div>

                        {/* 1500m Freestyle Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">1500m Freestyle Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming1500mFreestyleTime}
                            onChange={(e) => setFormData({ ...formData, swimming1500mFreestyleTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 1500m freestyle"
                            />
                            {formData.swimming1500mFreestyleTime && (
                            <p className="text-sm text-gray-500">1500m Freestyle Time: {formData.swimming1500mFreestyleTime}</p>
                            )}
                        </div>

                        {/* 50m Backstroke Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">50m Backstroke Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming50mBackstrokeTime}
                            onChange={(e) => setFormData({ ...formData, swimming50mBackstrokeTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 50m backstroke"
                            />
                            {formData.swimming50mBackstrokeTime && (
                            <p className="text-sm text-gray-500">50m Backstroke Time: {formData.swimming50mBackstrokeTime}</p>
                            )}
                        </div>

                        {/* 100m Backstroke Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">100m Backstroke Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming100mBackstrokeTime}
                            onChange={(e) => setFormData({ ...formData, swimming100mBackstrokeTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 100m backstroke"
                            />
                            {formData.swimming100mBackstrokeTime && (
                            <p className="text-sm text-gray-500">100m Backstroke Time: {formData.swimming100mBackstrokeTime}</p>
                            )}
                        </div>

                        {/* 200m Backstroke Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">200m Backstroke Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming200mBackstrokeTime}
                            onChange={(e) => setFormData({ ...formData, swimming200mBackstrokeTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 200m backstroke"
                            />
                            {formData.swimming200mBackstrokeTime && (
                            <p className="text-sm text-gray-500">200m Backstroke Time: {formData.swimming200mBackstrokeTime}</p>
                            )}
                        </div>

                        {/* 50m Breaststroke Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">50m Breaststroke Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming50mBreaststrokeTime}
                            onChange={(e) => setFormData({ ...formData, swimming50mBreaststrokeTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 50m breaststroke"
                            />
                            {formData.swimming50mBreaststrokeTime && (
                            <p className="text-sm text-gray-500">50m Breaststroke Time: {formData.swimming50mBreaststrokeTime}</p>
                            )}
                        </div>

                        {/* 100m Breaststroke Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">100m Breaststroke Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming100mBreaststrokeTime}
                            onChange={(e) => setFormData({ ...formData, swimming100mBreaststrokeTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 100m breaststroke"
                            />
                            {formData.swimming100mBreaststrokeTime && (
                            <p className="text-sm text-gray-500">100m Breaststroke Time: {formData.swimming100mBreaststrokeTime}</p>
                            )}
                        </div>

                        {/* 200m Breaststroke Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">200m Breaststroke Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming200mBreaststrokeTime}
                            onChange={(e) => setFormData({ ...formData, swimming200mBreaststrokeTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 200m breaststroke"
                            />
                            {formData.swimming200mBreaststrokeTime && (
                            <p className="text-sm text-gray-500">200m Breaststroke Time: {formData.swimming200mBreaststrokeTime}</p>
                            )}
                        </div>

                        {/* 50m Butterfly Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">50m Butterfly Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming50mButterflyTime}
                            onChange={(e) => setFormData({ ...formData, swimming50mButterflyTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 50m butterfly"
                            />
                            {formData.swimming50mButterflyTime && (
                            <p className="text-sm text-gray-500">50m Butterfly Time: {formData.swimming50mButterflyTime}</p>
                            )}
                        </div>

                        {/* 100m Butterfly Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">100m Butterfly Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming100mButterflyTime}
                            onChange={(e) => setFormData({ ...formData, swimming100mButterflyTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 100m butterfly"
                            />
                            {formData.swimming100mButterflyTime && (
                            <p className="text-sm text-gray-500">100m Butterfly Time: {formData.swimming100mButterflyTime}</p>
                            )}
                        </div>

                        {/* 200m Butterfly Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">200m Butterfly Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming200mButterflyTime}
                            onChange={(e) => setFormData({ ...formData, swimming200mButterflyTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 200m butterfly"
                            />
                            {formData.swimming200mButterflyTime && (
                            <p className="text-sm text-gray-500">200m Butterfly Time: {formData.swimming200mButterflyTime}</p>
                            )}
                        </div>
                                {/* 100m Individual Medley Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">100m Individual Medley Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming100mIndividualMedleyTime}
                            onChange={(e) => setFormData({ ...formData, swimming100mIndividualMedleyTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 100m individual medley"
                            />
                            {formData.swimming100mIndividualMedleyTime && (
                            <p className="text-sm text-gray-500">100m Individual Medley Time: {formData.swimming100mIndividualMedleyTime}</p>
                            )}
                        </div>

                        {/* 200m Individual Medley Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">200m Individual Medley Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming200mIndividualMedleyTime}
                            onChange={(e) => setFormData({ ...formData, swimming200mIndividualMedleyTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 200m individual medley"
                            />
                            {formData.swimming200mIndividualMedleyTime && (
                            <p className="text-sm text-gray-500">200m Individual Medley Time: {formData.swimming200mIndividualMedleyTime}</p>
                            )}
                        </div>

                        {/* 400m Individual Medley Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">400m Individual Medley Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming400mIndividualMedleyTime}
                            onChange={(e) => setFormData({ ...formData, swimming400mIndividualMedleyTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 400m individual medley"
                            />
                            {formData.swimming400mIndividualMedleyTime && (
                            <p className="text-sm text-gray-500">400m Individual Medley Time: {formData.swimming400mIndividualMedleyTime}</p>
                            )}
                        </div>

                        {/* 5km Open Water Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">5km Open Water Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming5kmOpenWaterTime}
                            onChange={(e) => setFormData({ ...formData, swimming5kmOpenWaterTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 5km open water"
                            />
                            {formData.swimming5kmOpenWaterTime && (
                            <p className="text-sm text-gray-500">5km Open Water Time: {formData.swimming5kmOpenWaterTime}</p>
                            )}
                        </div>

                        {/* 7.5km Open Water Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">7.5km Open Water Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming75kmOpenWaterTime}
                            onChange={(e) => setFormData({ ...formData, swimming75kmOpenWaterTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 7.5km open water"
                            />
                            {formData.swimming75kmOpenWaterTime && (
                            <p className="text-sm text-gray-500">7.5km Open Water Time: {formData.swimming75kmOpenWaterTime}</p>
                            )}
                        </div>

                        {/* 10km Open Water Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">10km Open Water Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming10kmOpenWaterTime}
                            onChange={(e) => setFormData({ ...formData, swimming10kmOpenWaterTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 10km open water"
                            />
                            {formData.swimming10kmOpenWaterTime && (
                            <p className="text-sm text-gray-500">10km Open Water Time: {formData.swimming10kmOpenWaterTime}</p>
                            )}
                        </div>

                        {/* 25km Open Water Time */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm text-gray-600">25km Open Water Time</label>
                            <input
                            type="text"
                            disabled={!editing}
                            value={formData.swimming25kmOpenWaterTime}
                            onChange={(e) => setFormData({ ...formData, swimming25kmOpenWaterTime: e.target.value })}
                            className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                            placeholder="Enter time for 25km open water"
                            />
                            {formData.swimming25kmOpenWaterTime && (
                            <p className="text-sm text-gray-500">25km Open Water Time: {formData.swimming25kmOpenWaterTime}</p>
                            )}
                        </div>
                    </div>
                    </div>
                )}
                {(formData.photos?.length > 0 || formData.videos?.length > 0) && (
                    <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl bg-opacity-90 backdrop-blur-md mt-6">
                      <h3 className="text-2xl font-semibold text-center text-indigo-600 mb-6">
                        Media Gallery
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {formData.photos.map((item, idx) => (
                          <img
                            key={idx}
                            src={item.url}
                            alt="uploaded"
                            className="w-64 h-64 object-cover rounded-xl border shadow-md transition-transform duration-200 hover:scale-105"
                          />
                        ))}
                        {formData.videos.map((item, idx) => (
                          <video
                            key={idx}
                            src={item.url}
                            controls
                            className="w-96 h-64 object-cover rounded-xl border shadow-md transition-transform duration-200 hover:scale-105"
                          />
                        ))}
                      </div>
                    </div>
                )}

            </div>  
        </div>
    )
}