import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2RmSFGSKqs7nNxeka_fRS8oyWFkcKyw4",
  authDomain: "scout-blitz.firebaseapp.com",
  projectId: "scout-blitz",
  storageBucket: "scout-blitz.firebasestorage.app",
  messagingSenderId: "132215161782",
  appId: "1:132215161782:web:adfaef31ddf2a650ef3717",
  measurementId: "G-YSV7R8FDBE"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const logout = () => {
  signOut(auth);
};
export {
  auth,
  db,
  logout,
  storage
};