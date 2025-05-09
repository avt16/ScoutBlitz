import React from 'react'
import {auth} from './FireBase'
import {sendPasswordResetEmail} from "firebase/auth";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const sendPasswordReset = async (email) => {
        try {
          await sendPasswordResetEmail(auth, email);
          alert("Password reset link sent!");
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      };
      return (
        <div class="bg-black flex items-center justify-center h-screen">  
          <div class="bg-gray-800 rounded-lg shadow-lg p-8 max-w-sm w-full">  
            <h2 class="text-white text-xl font-semibold mb-2 text-center">Forgot Password</h2>  
            <p class="text-gray-400 text-center mb-4">Enter your email to reset your password.</p>  
      
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
      
            <button 
              type="button" 
              class="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-500 transition" 
              onClick={()=> {sendPasswordReset(email), navigate('/login')}}
            >
              Send Password Reset Link
            </button>  
          </div>  
        </div>  
      )
      
}

export default ForgotPassword
