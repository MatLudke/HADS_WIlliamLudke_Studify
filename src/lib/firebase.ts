// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Reminder: add other Firebase SDKs here if needed
// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "tempo-certo-qf64u",
  "appId": "1:1044295739285:web:d583b8dfdb56de33ec789c",
  "storageBucket": "tempo-certo-qf64u.appspot.com",
  "apiKey": "AIzaSyBCuaWiC3-tlpttDR_PBfGgKtFsKMflrK8",
  "authDomain": "tempo-certo-qf64u.firebaseapp.com",
  "messagingSenderId": "1044295739285"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { app };
