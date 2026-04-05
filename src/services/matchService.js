import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { defaultMatches } from "../data/defaultMatches";
import { db } from "../firebase";

const matchesCollection = collection(db, "matches");
const picksCollection = collection(db, "picks");

export async function seedMatchesIfEmpty() {
  const snapshot = await getDocs(matchesCollection);

  if (!snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  defaultMatches.forEach((match) => {
    batch.set(doc(db, "matches", match.id), {
      ...match,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export function subscribeToMatches(onData, onError) {
  const matchesQuery = query(matchesCollection);

  return onSnapshot(
    matchesQuery,
    (snapshot) => {
      const matches = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(matches);
    },
    onError
  );
}

export function subscribeToUserPicks(userId, onData, onError) {
  const picksQuery = query(picksCollection, where("userId", "==", userId));

  return onSnapshot(
    picksQuery,
    (snapshot) => {
      const picks = snapshot.docs.reduce((accumulator, item) => {
        const data = item.data();
        accumulator[data.matchId] = data.selectedTeam;
        return accumulator;
      }, {});

      onData(picks);
    },
    onError
  );
}

export async function saveUserPick({ userId, matchId, selectedTeam }) {
  const pickId = `${userId}_${matchId}`;

  await setDoc(doc(db, "picks", pickId), {
    userId,
    matchId,
    selectedTeam,
    updatedAt: serverTimestamp(),
  });
}
