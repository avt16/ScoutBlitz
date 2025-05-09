import './App.css'
import Login from './components/login'
import SignUp from './components/SignUp'
import ForgotPassword from './components/ForgotPassword'
import HomePage from './components/HomePage'
import Profile from './components/Profile'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Chat from './components/Chat'

function App() {

  return (
      <div> 
        <BrowserRouter>
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path='/' element={<HomePage/>}/>
          {/* myProfile */}
          <Route path='/Profile' element={<Profile isMyProfile={true}/>}/>
          {/* general use profile */}
          <Route path='/Profile/:userId' element={<Profile isMyProfile={false}/>}/>
          <Route path="/chat/:chatPartnerId" element={<Chat />} />
        </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App
