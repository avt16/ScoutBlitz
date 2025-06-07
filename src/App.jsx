import './App.css';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import HomePage from './components/HomePage';
import Profile from './components/Profile';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import { Analytics } from "@vercel/analytics/react";
import Discovery from './components/Discovery';
import Feed from './components/Feed';

function App() {

  return (
      <div> 
        <BrowserRouter>
        <Analytics/>
        <Routes>
          <Route path='/feed' element = {<Feed/>}/>
          <Route path='/discovery' element = {<Discovery/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path='/' element={<HomePage/>}/>
          {/* myProfile */}
          <Route path='/profile' element={<Profile isMyProfile={true}/>}/>
          {/* general use profile */}
          <Route path='/profile/:userId' element={<Profile isMyProfile={false}/>}/>
          <Route path="/chat/:chatPartnerId" element={<Chat />} />
        </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App
