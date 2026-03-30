// 🔐 Auth Context
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { assignUserToClassroom } from '../utils/classroom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUserData(snap.data());
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (email, password, username) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const { classroomId, classroomNumber, currentClass } = await assignUserToClassroom(cred.user.uid);

    const newUser = {
      uid: cred.user.uid,
      email,
      username,
      bio: '',
      photoURL: '',
      classroomId,
      classroomNumber,
      currentClass,
      points: 0,
      streak: 0,
      lastLoginDate: new Date().toISOString(),
      totalStudyHours: 0,
      achievements: [],
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', cred.user.uid), newUser);
    setUserData(newUser);
    return cred;
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) {
      const data = snap.data();
      // Update streak on login
      const today = new Date().toDateString();
      const lastLogin = data.lastLoginDate ? new Date(data.lastLoginDate).toDateString() : null;
      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newStreak = lastLogin === yesterday.toDateString() ? data.streak + 1 : 1;
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...data,
          streak: newStreak,
          lastLoginDate: new Date().toISOString()
        });
        setUserData({ ...data, streak: newStreak });
      } else {
        setUserData(data);
      }
    }
    return cred;
  };

  const logout = () => signOut(auth);

  const refreshUserData = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) setUserData(snap.data());
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signup, login, logout, refreshUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
