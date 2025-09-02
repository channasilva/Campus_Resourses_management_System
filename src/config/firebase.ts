import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

// Add configuration for production environment
if (typeof window !== 'undefined') {
  // Ensure proper domain handling for GitHub Pages
  const currentDomain = window.location.hostname;
  const currentOrigin = window.location.origin;
  
  console.log('?? Current domain:', currentDomain);
  console.log('?? Current origin:', currentOrigin);
  console.log('?? Current pathname:', window.location.pathname);
  
  // Log Firebase configuration for debugging
  console.log('?? Firebase Config:', {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    currentDomain: currentDomain,
    currentOrigin: currentOrigin
  });
  
  // Diagnostic information for troubleshooting
  console.log('?? Firebase Diagnostic Info:', {
    userAgent: navigator.userAgent,
    protocol: window.location.protocol,
    host: window.location.host,
    hostname: window.location.hostname,
    port: window.location.port,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });
}

export default app;
