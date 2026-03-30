// 🧠 Core Logic: Classroom assignment, points, rank progression

import { db } from './firebase';
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, increment, runTransaction
} from 'firebase/firestore';

export const CLASS_ORDER = ['D', 'C', 'B', 'A'];
export const MAX_PER_CLASS = 10;
export const MAX_PER_CLASSROOM = 40;

// Points thresholds for class promotion
export const PROMOTION_THRESHOLDS = {
  D: 0,
  C: 500,
  B: 1500,
  A: 3500,
};

// Points awarded per action
export const POINT_RULES = {
  loginStreak: 10,
  studyHourBase: 15,       // per hour
  topicCovered: 20,
  weeklyDiscipline: 100,
  dailyLoginBonus: 5,
};

/**
 * Assigns a new user to an available classroom + Class D.
 * Creates a new classroom if all existing ones are full.
 */
export async function assignUserToClassroom(userId) {
  // Find classroom with space in Class D
  const classroomsRef = collection(db, 'classrooms');
  const snapshot = await getDocs(classroomsRef);

  let assignedClassroom = null;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const classD = data.classes?.D || [];
    if (classD.length < MAX_PER_CLASS) {
      assignedClassroom = { id: docSnap.id, ...data };
      break;
    }
  }

  // If no space found, create new classroom
  if (!assignedClassroom) {
    const newClassroomNumber = snapshot.size + 1;
    const newClassroomRef = doc(collection(db, 'classrooms'));
    const newClassroom = {
      classroomNumber: newClassroomNumber,
      classes: { A: [], B: [], C: [], D: [] },
      createdAt: serverTimestamp(),
    };
    await setDoc(newClassroomRef, newClassroom);
    assignedClassroom = { id: newClassroomRef.id, ...newClassroom, classroomNumber: newClassroomNumber };
  }

  // Add user to Class D of that classroom
  await updateDoc(doc(db, 'classrooms', assignedClassroom.id), {
    [`classes.D`]: [...(assignedClassroom.classes?.D || []), userId],
  });

  return {
    classroomId: assignedClassroom.id,
    classroomNumber: assignedClassroom.classroomNumber,
    currentClass: 'D',
  };
}

/**
 * Recalculates user class based on points and moves them if needed.
 */
export async function checkAndPromoteUser(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const { points, currentClass, classroomId } = userData;

  let newClass = 'D';
  for (const cls of CLASS_ORDER) {
    if (points >= PROMOTION_THRESHOLDS[cls]) {
      newClass = cls;
    }
  }

  if (newClass !== currentClass) {
    // Update classroom document - remove from old class, add to new
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomSnap = await getDoc(classroomRef);
    const classroomData = classroomSnap.data();

    const oldClassList = (classroomData.classes[currentClass] || []).filter(id => id !== userId);
    const newClassList = [...(classroomData.classes[newClass] || []), userId];

    await updateDoc(classroomRef, {
      [`classes.${currentClass}`]: oldClassList,
      [`classes.${newClass}`]: newClassList,
    });

    await updateDoc(userRef, { currentClass: newClass });
    return newClass;
  }
  return currentClass;
}

/**
 * Logs a study session and awards points.
 */
export async function logStudySession(userId, { hours, topics, subject }) {
  const pointsEarned =
    Math.floor(hours) * POINT_RULES.studyHourBase +
    topics.length * POINT_RULES.topicCovered;

  // Save study log
  const logRef = doc(collection(db, 'studyLogs'));
  await setDoc(logRef, {
    userId,
    hours,
    topics,
    subject,
    pointsEarned,
    date: serverTimestamp(),
  });

  // Update user points and check promotion
  await updateDoc(doc(db, 'users', userId), {
    points: increment(pointsEarned),
    totalStudyHours: increment(hours),
    lastStudied: serverTimestamp(),
  });

  await checkAndPromoteUser(userId);
  return pointsEarned;
}

/**
 * Records daily login streak.
 */
export async function recordDailyLogin(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const lastLogin = userData.lastLogin?.toDate();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Don't count Sunday in streak
  if (dayOfWeek === 0) {
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
    return;
  }

  let newStreak = userData.streak || 0;
  if (lastLogin) {
    const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // Reset streak
    }
  } else {
    newStreak = 1;
  }

  const bonusPoints = newStreak > 0 ? POINT_RULES.loginStreak + POINT_RULES.dailyLoginBonus : POINT_RULES.dailyLoginBonus;

  await updateDoc(userRef, {
    streak: newStreak,
    lastLogin: serverTimestamp(),
    points: increment(bonusPoints),
  });

  await checkAndPromoteUser(userId);
  return { newStreak, bonusPoints };
}

/**
 * Get leaderboard for a classroom.
 */
export async function getClassroomLeaderboard(classroomId) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('classroomId', '==', classroomId),
    orderBy('points', 'desc'),
    limit(40)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get global leaderboard (top 50).
 */
export async function getGlobalLeaderboard() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('points', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get or create a 1-1 chat room between two users.
 */
export async function getOrCreateChatRoom(userId1, userId2) {
  const roomId = [userId1, userId2].sort().join('_');
  const roomRef = doc(db, 'chatRooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    await setDoc(roomRef, {
      participants: [userId1, userId2],
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
    });
  }
  return roomId;
}
