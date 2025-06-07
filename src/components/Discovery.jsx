import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './FireBase';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { MessageCircle, User, Users, Activity } from "lucide-react";

const SPORT_STATS = {
  "Football": [
    { value: "footballGamesPlayed", label: "Games Played" },
    { value: "footballGamesStarted", label: "Games Started" },
    { value: "footballGoalsScored", label: "Goals Scored" },
    { value: "footballAssistsMade", label: "Assists Made" }
  ],
  "Basketball": [
    { value: "basketballGamesPlayed", label: "Games Played" },
    { value: "basketballGamesStarted", label: "Games Started" },
    { value: "basketballPointsPerGame", label: "Points Per Game" },
    { value: "basketballAssistsPerGame", label: "Assists Per Game" },
    { value: "basketballDefensiveReboundsPerGame", label: "Defensive Rebounds Per Game" },
    { value: "basketballOffensiveReboundsPerGame", label: "Offensive Rebounds Per Game" },
    { value: "basketballTotalReboundsPerGame", label: "Total Rebounds Per Game" },
    { value: "basketballStealsPerGame", label: "Steals Per Game" },
    { value: "basketballBlocksPerGame", label: "Blocks Per Game" },
    { value: "basketballTurnoversPerGame", label: "Turnovers Per Game" }
  ],
  "Running": [
    { value: "running60mSprintTime", label: "60m Sprint Time" },
    { value: "running100mSprintTime", label: "100m Sprint Time" },
    { value: "running200mSprintTime", label: "200m Sprint Time" },
    { value: "running400mRunTime", label: "400m Run Time" },
    { value: "running800mRunTime", label: "800m Run Time" },
    { value: "running1000mTrackRunTime", label: "1000m Track Run Time" },
    { value: "running1500mTrackRunTime", label: "1500m Track Run Time" },
    { value: "running1MileTrackRunTime", label: "1 Mile Track Run Time" },
    { value: "running2000mTrackRunTime", label: "2000m Track Run Time" },
    { value: "running3000mTrackRunTime", label: "3000m Track Run Time" },
    { value: "running5000mTrackRunTime", label: "5000m Track Run Time" },
    { value: "running10000mTrackRunTime", label: "10000m Track Run Time" },
    { value: "running60mHurdlesRunTime", label: "60m Hurdles Run Time" },
    { value: "running110mHurdlesRunTime", label: "110m Hurdles Run Time" },
    { value: "running400mHurdlesRunTime", label: "400m Hurdles Run Time" },
    { value: "running3000mSteeplechaseRunTime", label: "3000m Steeplechase Run Time" },
    { value: "running3kmRoadRunTime", label: "3km Road Run Time" },
    { value: "running5kmRoadRunTime", label: "5km Road Run Time" },
    { value: "running10kmRoadRunTime", label: "10km Road Run Time" },
    { value: "runningHalfMarathonRunTime", label: "Half Marathon Run Time" },
    { value: "runningMarathonRunTime", label: "Marathon Run Time" },
    { value: "running50kmRoadRunTime", label: "50km Road Run Time" },
    { value: "running100kmRoadRunTime", label: "100km Road Run Time" }
  ],
  "Swimming": [
    { value: "swimming50mFreestyleTime", label: "50m Freestyle Time" },
    { value: "swimming100mFreestyleTime", label: "100m Freestyle Time" },
    { value: "swimming200mFreestyleTime", label: "200m Freestyle Time" },
    { value: "swimming400mFreestyleTime", label: "400m Freestyle Time" },
    { value: "swimming800mFreestyleTime", label: "800m Freestyle Time" },
    { value: "swimming1500mFreestyleTime", label: "1500m Freestyle Time" },
    { value: "swimming50mBackstrokeTime", label: "50m Backstroke Time" },
    { value: "swimming100mBackstrokeTime", label: "100m Backstroke Time" },
    { value: "swimming200mBackstrokeTime", label: "200m Backstroke Time" },
    { value: "swimming50mBreaststrokeTime", label: "50m Breaststroke Time" },
    { value: "swimming100mBreaststrokeTime", label: "100m Breaststroke Time" },
    { value: "swimming200mBreaststrokeTime", label: "200m Breaststroke Time" },
    { value: "swimming50mButterflyTime", label: "50m Butterfly Time" },
    { value: "swimming100mButterflyTime", label: "100m Butterfly Time" },
    { value: "swimming200mButterflyTime", label: "200m Butterfly Time" },
    { value: "swimming100mIndividualMedleyTime", label: "100m Individual Medley Time" },
    { value: "swimming200mIndividualMedleyTime", label: "200m Individual Medley Time" },
    { value: "swimming400mIndividualMedleyTime", label: "400m Individual Medley Time" },
    { value: "swimming5kmOpenWaterTime", label: "5km Open Water Time" },
    { value: "swimming75kmOpenWaterTime", label: "7.5km Open Water Time" },
    { value: "swimming10kmOpenWaterTime", label: "10km Open Water Time" },
    { value: "swimming25kmOpenWaterTime", label: "25km Open Water Time" }
  ]
};

const ALL_SPORTS = ['Football', 'Running', 'Basketball', 'Swimming']
const GENDERS = ['Male', 'Female', 'Other'];
function Discovery() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sport, setSport] = useState('');
  const [gender, setGender] = useState('');
  const [stat, setStat] = useState('');
  const [statOptions, setStatOptions] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const data = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          if (d.type === 'Athlete' || d.type === 'Coach') {
            data.push({ ...d, id: doc.id });
          }
        });
        setUsers(data);
        console.log(users);
        setFiltered(data);
      } catch (error) {
        console.error('Firebase error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (sport && SPORT_STATS[sport]) {
      setStatOptions(SPORT_STATS[sport]);
      setStat('');
    } else {
      setStatOptions([]);
      setStat('');
    }
  }, [sport]);

  useEffect(() => {
    let result = users;
    console.log(users);
    if (sport) result = result.filter((u) => u.sport === sport);
    if (gender) result = result.filter((u) => u.gender === gender);
    if (search) {
      result = result.filter(
        u =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.sport?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [sport, gender, search, users]);

  const handleMessage = (e, userId) => {
    e.stopPropagation();
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Discover Athletes & Coaches</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
          <div className="relative w-full md:w-60">
            <input
              type="text"
              placeholder="Search by name or sport"
              className="p-2 pl-10 rounded-lg border border-gray-200 w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <User className="absolute left-3 top-2.5 text-gray-400"  size={18} />
          </div>
          <div className=" relative w-full md:w-48">
            <select
              className="p-2 pl-10 rounded-lg border border-gray-200 w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
            <option value="">Select Sport</option>
            {ALL_SPORTS.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
            </select>
            <Activity className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <div className="relative w-full md:w-40">
            <select
              className="p-2 pl-10 rounded-lg border border-gray-200 w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">All Genders</option>
              {GENDERS.map(g=> (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          {statOptions.length > 0 && (
            <div className="relative w-full md:w-48">
              <select
                className="p-2 pl-10 rounded-lg border border-gray-200 w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none"
                value={stat}
                onChange={(e) => setStat(e.target.value)}
              >
                <option value="">Select Stat</option>
                {statOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Users */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(user => (
            <Card key={user.id} onClick={()=> navigate(`/profile/${user.id}`)} className="overflow-hidden bg-white border-gray-100 rounded-lg hover:shadow-md cursor-pointer">
              <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50"></div>
              <CardContent>
                <Avatar>
                  <AvatarImage src={user.profile_pic || 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg' } alt={user.name}/>
                  <AvatarFallback className="bg-blue-100 text-blue-600">{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                  <div className='mt-2 space-y-1'>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Role:</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">{user.type}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Sport::</span> {user.sport}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Gender:</span> {user.gender}
                    </div>

                    {stat && user[stat] && (
                      <div>
                        <span className="font-medium mr-2">{statOptions.find(opt=> opt.value===stat)?.label}:</span> {user[stat]}
                      </div>
                    )}
                  </div>
                  <Button onClick={(e)=>handleMessage(e,user.id)} className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 py-1 h-8">
                    <MessageCircle size={16}/>
                    <span>Message</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 text-center text-gray-500">
            No users match the selected filters.
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default Discovery;
