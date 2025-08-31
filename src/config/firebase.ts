import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDa63IAknYHAx_zUbxtCXXaxYnh8ExZ9fY",
  authDomain: "campus-resources-demo.firebaseapp.com",
  projectId: "campus-resources-demo",
  storageBucket: "campus-resources-demo.firebasestorage.app",
  messagingSenderId: "96808245065",
  appId: "1:96808245065:web:75462c690a22b3e887ec98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;