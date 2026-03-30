// 🔐 Authentication Context
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { assignUserToClassroom, recordDailyLogin } from '../lib/gameLogic';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, username) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });

    // Assign to classroom
    const classroomData = await assignUserToClassroom(result.user.uid);

    // Create user document
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email,
      username,
      bio: '',
      photoURL: '',
      points: 0,
      streak: 0,
      totalStudyHours: 0,
      currentClass: 'D',
      classroomId: classroomData.classroomId,
      classroomNumber: classroomData.classroomNumber,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      lastStudied: null,
      achievements: [],
      weeklyPoints: 0,
    });

    return result;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Record daily login for streak
    await recordDailyLogin(result.user.uid);
    return result;
  }

  async function logout() {
    setUserData(null);
    return signOut(auth);
  }

  async function refreshUserData(uid) {
    if (!uid) return;
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      setUserData({ id: snap.id, ...snap.data() });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshUserData(user.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
