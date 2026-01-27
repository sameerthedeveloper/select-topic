import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBVmyc23jy3CLmiK04z2YZahclC7uK3P3A",
    authDomain: "selectstudent-65fe2.firebaseapp.com",
    projectId: "selectstudent-65fe2",
    storageBucket: "selectstudent-65fe2.firebasestorage.app",
    messagingSenderId: "391483688072",
    appId: "1:391483688072:web:25cc5d7a9ca2e6001d8b3d",
    measurementId: "G-DMLBM46WB9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
