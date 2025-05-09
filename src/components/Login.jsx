import React, { useState } from 'react'
import { FcGoogle } from "react-icons/fc";
import {auth, db} from './FireBase'
import {
    // getFirestore,
    query,
    getDocs,
    collection,
    where,
  } from "firebase/firestore";
  import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    // sendPasswordResetEmail,
  } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const googleProvider = new GoogleAuthProvider();
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      alert("Account not Found. Please Register first");
      navigate("/SignUp");
    } else {
      navigate('/');
    }
  } 
    catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const logInWithEmailAndPassword = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div class="bg-black flex items-center justify-center h-screen">  
      <div class="bg-gray-800 rounded-lg shadow-lg p-8 max-w-sm w-full">  
        <div class="flex justify-center mb-4">  
          <div class="text-white text-2xl font-semibold">Scout Blitz</div>  
        </div>  
        <h2 class="text-white text-xl font-semibold mb-2 text-center">Welcome Back</h2>  
        <p class="text-gray-400 text-center mb-4">Don't have an account yet? 
          <span class="text-blue-500 hover:underline cursor-pointer" onClick={()=> navigate('/SignUp')}>Sign up</span>
        </p>  
        
        <form>  
          <div class="mb-4">  
            <label class="block text-gray-300 mb-1" htmlFor="email">Email Address</label>  
            <input 
              type="email" 
              id="email" 
              class="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring focus:ring-blue-500" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />  
          </div>  
    
          <div class="mb-6">  
            <label class="block text-gray-300 mb-1" htmlFor="password">Password</label>  
            <input 
              type="password" 
              id="password" 
              class="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring focus:ring-blue-500" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />  
          </div>  
    
          <button 
            type="button" 
            class="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-500 transition" 
            onClick={() => logInWithEmailAndPassword(email, password)}
          >
            Login
          </button>  
        </form>  
    
        <div class="flex items-center justify-center mt-4">  
          <div class="border-t border-gray-600 w-full mr-4"></div>  
          <span class="text-gray-400">OR</span>  
          <div class="border-t border-gray-600 w-full ml-4"></div>  
        </div>  
    
        <div class="flex justify-center mt-4">  
          <button 
            class="bg-gray-700 text-white w-full p-2 rounded hover:bg-gray-600 transition"
            onClick={() => signInWithGoogle()}
          >  
          <div className = "flex flex-row items-center justify-center gap-2">
          <span>Sign in with Google</span>
          <FcGoogle />
          </div>
          </button>  
        </div>  
    
        <div class="text-center mt-4">  
          <span 
            class="text-gray-400 hover:underline cursor-pointer" 
            onClick={() => navigate('/forgotPassword')}
          >Forgot Password?</span>  
        </div>  
      </div>  
    </div>  
  )
}

export default Login
