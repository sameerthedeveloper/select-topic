import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  async function login() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch additional user data from Firestore if exists
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
            setUserData(null);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
