import {
  arrayUnion,
  arrayRemove,
  addDoc,
  writeBatch,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const leaguesCollection = collection(db, "leagues");
const leagueMembersCollection = collection(db, "leagueMembers");
const leagueRequestsCollection = collection(db, "leagueRequests");
const matchesCollection = collection(db, "matches");
const picksCollection = collection(db, "picks");
const leagueScoresCollection = collection(db, "leagueScores");
const SEASON_ENTRY_FEE = 40;
const TOTAL_SEASON_MATCH_UNITS = 74;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function scoreDocumentId(leagueId, userId) {
  return `${leagueId}_${userId}`;
}

function getDefaultLeagueName(user) {
  const firstName = user?.displayName?.split(" ")[0] || "Admin";
  return `${firstName}'s Admin`;
}

async function loadLeagueById(leagueId) {
  const snapshot = await getDoc(doc(db, "leagues", leagueId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function createLeague({ name, user }) {
  const existingLeagueQuery = query(leaguesCollection, where("createdBy", "==", user.uid));
  const existingLeagueSnapshot = await getDocs(existingLeagueQuery);

  if (!existingLeagueSnapshot.empty) {
    throw new Error("This admin already has a league.");
  }

  const leagueReference = await addDoc(leaguesCollection, {
    name: name.trim(),
    createdBy: user.uid,
    members: [user.uid],
    adminUid: user.uid,
    adminEmail: user.email,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "leagueScores", scoreDocumentId(leagueReference.id, user.uid)), {
    leagueId: leagueReference.id,
    userId: user.uid,
    userEmail: user.email,
    totalPoints: 0,
    updatedAt: serverTimestamp(),
  });

  return leagueReference.id;
}

export async function ensureDefaultAdminLeague(user) {
  const existingLeagueQuery = query(leaguesCollection, where("createdBy", "==", user.uid));
  const existingLeagueSnapshot = await getDocs(existingLeagueQuery);

  if (!existingLeagueSnapshot.empty) {
    const firstLeague = existingLeagueSnapshot.docs[0];
    return {
      id: firstLeague.id,
      ...firstLeague.data(),
    };
  }

  const defaultLeagueName = getDefaultLeagueName(user);
  const leagueReference = await addDoc(leaguesCollection, {
    name: defaultLeagueName,
    createdBy: user.uid,
    members: [user.uid],
    adminUid: user.uid,
    adminEmail: user.email,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "leagueScores", scoreDocumentId(leagueReference.id, user.uid)), {
    leagueId: leagueReference.id,
    userId: user.uid,
    userEmail: user.email,
    totalPoints: 0,
    updatedAt: serverTimestamp(),
  });

  return {
    id: leagueReference.id,
    name: defaultLeagueName,
    createdBy: user.uid,
    members: [user.uid],
    adminUid: user.uid,
    adminEmail: user.email,
  };
}

export function subscribeToUserLeagues(userId, onData, onError) {
  const adminLeaguesQuery = query(leaguesCollection, where("adminUid", "==", userId));
  const memberLeaguesQuery = query(leagueMembersCollection, where("userId", "==", userId));

  let adminLeagueIds = [];
  let memberLeagueIds = [];

  const publishLeagues = async () => {
    const leagueIds = [...new Set([...adminLeagueIds, ...memberLeagueIds])];

    if (!leagueIds.length) {
      onData([]);
      return;
    }

    try {
      const leagues = await Promise.all(leagueIds.map((leagueId) => loadLeagueById(leagueId)));
      onData(leagues.filter(Boolean));
    } catch (error) {
      onError(error);
    }
  };

  const unsubscribeAdminLeagues = onSnapshot(
    adminLeaguesQuery,
    (snapshot) => {
      adminLeagueIds = snapshot.docs.map((item) => item.id);
      publishLeagues();
    },
    onError
  );

  const unsubscribeMemberLeagues = onSnapshot(
    memberLeaguesQuery,
    (snapshot) => {
      memberLeagueIds = snapshot.docs.map((item) => item.data().leagueId);
      publishLeagues();
    },
    onError
  );

  return () => {
    unsubscribeAdminLeagues();
    unsubscribeMemberLeagues();
  };
}

export function subscribeToAllLeagues(onData, onError) {
  return onSnapshot(
    leaguesCollection,
    (snapshot) => {
      const leagues = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

      onData(leagues);
    },
    onError
  );
}

export function subscribeToAdminCreatedLeagues(userId, onData, onError) {
  const leaguesQuery = query(leaguesCollection, where("createdBy", "==", userId));

  return onSnapshot(
    leaguesQuery,
    (snapshot) => {
      const leagues = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

      onData(leagues);
    },
    onError
  );
}

export function subscribeToLeague(leagueId, onData, onError) {
  return onSnapshot(
    doc(db, "leagues", leagueId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError
  );
}

export function subscribeToLeagueMembers(leagueId, onData, onError) {
  const membersQuery = query(leagueMembersCollection, where("leagueId", "==", leagueId));

  return onSnapshot(
    membersQuery,
    (snapshot) => {
      const members = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(members);
    },
    onError
  );
}

export function subscribeToUserLeagueRequests(userId, onData, onError) {
  const requestsQuery = query(leagueRequestsCollection, where("userId", "==", userId));

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      const requests = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(requests);
    },
    onError
  );
}

export function subscribeToPendingLeagueRequests(leagueId, onData, onError) {
  const requestsQuery = query(
    leagueRequestsCollection,
    where("leagueId", "==", leagueId),
    where("status", "==", "pending")
  );

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      const requests = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(requests);
    },
    onError
  );
}

export async function requestToJoinLeague({ leagueId, userId, userEmail }) {
  const requestReference = doc(db, "leagueRequests", `${leagueId}_${userId}`);
  const existingRequestsQuery = query(
    leagueRequestsCollection,
    where("userId", "==", userId),
    where("leagueId", "==", leagueId),
    where("status", "==", "pending")
  );
  const existingRequestsSnapshot = await getDocs(existingRequestsQuery);

  if (!existingRequestsSnapshot.empty) {
    throw new Error("You already have a request pending for this league.");
  }

  await setDoc(requestReference, {
    userId,
    leagueId,
    userEmail,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function approveLeagueRequest({ leagueId, requestId, userId, userEmail }) {
  const batch = writeBatch(db);

  batch.set(doc(db, "leagueMembers", `${leagueId}_${userId}`), {
    leagueId,
    userId,
    userEmail,
    role: "member",
    joinedAt: serverTimestamp(),
    source: "request",
  });

  batch.update(doc(db, "leagues", leagueId), {
    members: arrayUnion(userId),
  });

  batch.update(doc(db, "leagueRequests", requestId), {
    status: "approved",
    resolvedAt: serverTimestamp(),
  });

  batch.set(
    doc(db, "leagueScores", scoreDocumentId(leagueId, userId)),
    {
      leagueId,
      userId,
      userEmail,
      totalPoints: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

export async function rejectLeagueRequest(requestId) {
  await updateDoc(doc(db, "leagueRequests", requestId), {
    status: "rejected",
    resolvedAt: serverTimestamp(),
  });
}

export function subscribeToLeagueMatches(leagueId, onData, onError) {
  const matchesQuery = query(matchesCollection, where("leagueId", "==", leagueId));

  return onSnapshot(
    matchesQuery,
    (snapshot) => {
      const matches = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .sort((left, right) => {
          const leftDateTime = left.dateTime || left.kickoff || "";
          const rightDateTime = right.dateTime || right.kickoff || "";
          return leftDateTime.localeCompare(rightDateTime);
        });

      onData(matches);
    },
    onError
  );
}

export async function createLeagueMatch({
  leagueId,
  matchName,
  dateTime,
  points,
  option1,
  option2,
  userId,
}) {
  await addDoc(matchesCollection, {
    leagueId,
    matchName: matchName.trim(),
    dateTime: dateTime.trim(),
    points: Number(points),
    option1: option1.trim(),
    option2: option2.trim(),
    teamA: option1.trim(),
    teamB: option2.trim(),
    kickoff: dateTime.trim(),
    venue: "",
    createdByUid: userId,
    createdAt: serverTimestamp(),
  });
}

export async function createLeagueMatchesBulk({ leagueId, matches, userId }) {
  if (!matches.length) {
    return;
  }

  const batch = writeBatch(db);

  matches.forEach((match) => {
    const matchReference = doc(matchesCollection);
    batch.set(matchReference, {
      leagueId,
      matchName: match.matchName.trim(),
      dateTime: match.dateTime.trim(),
      points: Number(match.points),
      option1: match.option1.trim(),
      option2: match.option2.trim(),
      teamA: match.option1.trim(),
      teamB: match.option2.trim(),
      kickoff: match.dateTime.trim(),
      venue: "",
      createdByUid: userId,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function updateLeagueMatch({
  matchId,
  matchName,
  dateTime,
  points,
  option1,
  option2,
}) {
  await updateDoc(doc(db, "matches", matchId), {
    matchName: matchName.trim(),
    dateTime: dateTime.trim(),
    points: Number(points),
    option1: option1.trim(),
    option2: option2.trim(),
    teamA: option1.trim(),
    teamB: option2.trim(),
    kickoff: dateTime.trim(),
  });
}

export async function deleteLeagueMatch(matchId) {
  await deleteDoc(doc(db, "matches", matchId));
}

export async function removeLeagueMember({ leagueId, userId }) {
  const batch = writeBatch(db);

  batch.delete(doc(db, "leagueMembers", `${leagueId}_${userId}`));
  batch.delete(doc(db, "leagueScores", scoreDocumentId(leagueId, userId)));
  batch.update(doc(db, "leagues", leagueId), {
    members: arrayRemove(userId),
  });

  await batch.commit();
}

export async function deleteAdminLeague(leagueId) {
  await deleteDoc(doc(db, "leagues", leagueId));
}

export function subscribeToLeaguePicks({ leagueId, userId }, onData, onError) {
  const picksQuery = query(
    picksCollection,
    where("leagueId", "==", leagueId),
    where("userId", "==", userId)
  );

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

export function subscribeToAllLeaguePicks(leagueId, onData, onError) {
  const picksQuery = query(picksCollection, where("leagueId", "==", leagueId));

  return onSnapshot(
    picksQuery,
    (snapshot) => {
      const picks = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(picks);
    },
    onError
  );
}

export function subscribeToLeagueScores(leagueId, onData, onError) {
  const scoresQuery = query(leagueScoresCollection, where("leagueId", "==", leagueId));

  return onSnapshot(
    scoresQuery,
    (snapshot) => {
      const scores = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .sort((left, right) => {
          const pointDiff = (right.totalPoints || 0) - (left.totalPoints || 0);
          if (pointDiff !== 0) {
            return pointDiff;
          }

          return (left.userEmail || "").localeCompare(right.userEmail || "");
        });

      onData(scores);
    },
    onError
  );
}

export async function saveLeaguePick({ leagueId, matchId, selectedTeam, userId, userEmail }) {
  await setDoc(doc(db, "picks", `${leagueId}_${matchId}_${userId}`), {
    leagueId,
    matchId,
    selectedTeam,
    userId,
    userEmail,
    updatedAt: serverTimestamp(),
  });
}

export async function finalizeLeagueMatch({ leagueId, matchId, winningOption }) {
  const matchReference = doc(db, "matches", matchId);
  const matchSnapshot = await getDoc(matchReference);

  if (!matchSnapshot.exists()) {
    throw new Error("Match not found.");
  }

  const matchData = matchSnapshot.data();
  const option1 = matchData.option1 || matchData.teamA;
  const option2 = matchData.option2 || matchData.teamB;

  if (![option1, option2].includes(winningOption)) {
    throw new Error("Winner must be one of the match options.");
  }

  const picksSnapshot = await getDocs(
    query(
      picksCollection,
      where("leagueId", "==", leagueId),
      where("matchId", "==", matchId)
    )
  );

  const picks = picksSnapshot.docs
    .map((item) => ({
      id: item.id,
      ref: item.ref,
      ...item.data(),
    }))
    .sort((left, right) => (left.userId || "").localeCompare(right.userId || ""));

  const winners = picks.filter((pick) => pick.selectedTeam === winningOption);
  const losers = picks.filter((pick) => pick.selectedTeam !== winningOption);
  const matchUnits = Math.max(Number(matchData.points || 1), 1);
  const stakePerPlayerCents = Math.round((SEASON_ENTRY_FEE / TOTAL_SEASON_MATCH_UNITS) * 100 * matchUnits);

  const deltasByPickId = new Map();

  if (winners.length && losers.length) {
    const winnerPool = losers.length * stakePerPlayerCents;
    const baseWinnerShare = Math.floor(winnerPool / winners.length);
    let remainder = winnerPool - baseWinnerShare * winners.length;

    winners.forEach((pick) => {
      const extraCent = remainder > 0 ? 1 : 0;
      deltasByPickId.set(pick.id, (baseWinnerShare + extraCent) / 100);
      remainder -= extraCent;
    });

    losers.forEach((pick) => {
      deltasByPickId.set(pick.id, -stakePerPlayerCents / 100);
    });
  } else {
    picks.forEach((pick) => {
      deltasByPickId.set(pick.id, 0);
    });
  }

  const batch = writeBatch(db);

  batch.update(matchReference, {
    winningOption,
    settledAt: serverTimestamp(),
  });

  picks.forEach((pick) => {
    const previousDelta = Number(pick.scoreDelta || 0);
    const nextDelta = deltasByPickId.get(pick.id) || 0;
    const scoreAdjustment = nextDelta - previousDelta;
    const outcome = pick.selectedTeam === winningOption ? "won" : "lost";

    batch.set(
      doc(db, "leagueScores", scoreDocumentId(leagueId, pick.userId)),
      {
        leagueId,
        userId: pick.userId,
        userEmail: pick.userEmail,
        totalPoints: increment(scoreAdjustment),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batch.update(pick.ref, {
      scoreDelta: nextDelta,
      outcome,
      winningOption,
      settledAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function getLeagueRole({ leagueId, userId }) {
  const league = await loadLeagueById(leagueId);

  if (league?.adminUid === userId) {
    return "admin";
  }

  const membership = await getDoc(doc(db, "leagueMembers", `${leagueId}_${userId}`));
  return membership.exists() ? membership.data().role : null;
}

export async function renameLeague({ leagueId, name }) {
  await updateDoc(doc(db, "leagues", leagueId), {
    name: name.trim(),
  });
}
