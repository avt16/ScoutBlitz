import React from 'react'
import {auth} from './FireBase'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import {db} from './FireBase';
import { FcGoogle } from "react-icons/fc";
import {createUserWithEmailAndPassword,} from "firebase/auth";
  import {
    // getFirestore,
    query,
    getDocs,
    collection,
    where,
    setDoc,
    doc
  } from "firebase/firestore";
  import {
    GoogleAuthProvider,
    signInWithPopup,
    // sendPasswordResetEmail,
  } from "firebase/auth";
function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState("Athlete");
    const googleProvider = new GoogleAuthProvider();
    const navigate = useNavigate();

    const registerWithEmailAndPassword = async (name, email, password) => {
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          const user = res.user;
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            authProvider: "local",
            email,
            type: type,
          });
          navigate("/");
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      };
      const signUpWithGoogle = async () => {
        try {
          const res = await signInWithPopup(auth, googleProvider);
          const user = res.user;
          const q = query(collection(db, "users"), where("uid", "==", user.uid));
             const docs = await getDocs(q);
             if (docs.docs.length === 0) {
               await setDoc(doc(db, "users", user.uid), {
                 uid: user.uid,
                 name: user.displayName,
                 authProvider: "google",
                 email: user.email,
                 type: type,
               });
             }
             navigate('/');
           }
             catch (err) {
             console.error(err);
             alert(err.message);
           }
         };

      return (
        <div class="bg-black flex items-center justify-center h-screen">
          <div class="bg-gray-800 rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h2 class="text-white text-xl font-semibold mb-2 text-center">Sign Up</h2>
            <p class="text-gray-400 text-center mb-4">Create an account to get started.</p>

            <div class="mb-4">
              <label class="block text-gray-300 mb-1" htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                class="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
            <div class="mb-6">
              <label class="block text-gray-300 mb-1" htmlFor="type">Athlete or Coach</label>
              <input
                type="text"
                id="type"
                class="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
                placeholder="Athlete or Coach?"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              class="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-500 transition"
              onClick={() => registerWithEmailAndPassword(name, email, password)}
            >
              Sign Up
            </button>
            <div class="flex justify-center mt-4">
              <button
                class="bg-gray-700 text-white w-full p-2 rounded hover:bg-gray-600 transition"
                onClick={() => signUpWithGoogle()}
              >
              <div class = "flex flex-row items-center justify-center gap-2">
              <span>Sign Up with Google</span>
              <FcGoogle />
              </div>
              </button>
            </div>
            <p class="text-gray-400 text-center mt-4">
              Already have an account? <Link to="/login" class="text-blue-500 hover:underline">Log In</Link>
            </p>
          </div>
        </div>
      )
}

export default SignUp