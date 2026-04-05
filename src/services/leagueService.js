import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
const leagueInvitesCollection = collection(db, "leagueInvites");
const matchesCollection = collection(db, "matches");
const picksCollection = collection(db, "picks");

function normalizeEmail(email) {
  return email.trim().toLowerCase();
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
  const leagueReference = await addDoc(leaguesCollection, {
    name: name.trim(),
    adminUid: user.uid,
    adminEmail: user.email,
    createdAt: serverTimestamp(),
  });

  return leagueReference.id;
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

export function subscribeToLeagueInvites(email, onData, onError) {
  const emailKey = normalizeEmail(email);
  const invitesQuery = query(leagueInvitesCollection, where("emailKey", "==", emailKey));

  return onSnapshot(
    invitesQuery,
    async (snapshot) => {
      try {
        const invites = await Promise.all(
          snapshot.docs.map(async (item) => {
            const data = item.data();
            const league = await loadLeagueById(data.leagueId);

            return {
              id: item.id,
              ...data,
              leagueName: league?.name || "Unknown league",
            };
          })
        );

        onData(invites);
      } catch (error) {
        onError(error);
      }
    },
    onError
  );
}

export async function acceptLeagueInvite({ inviteId, invite, user }) {
  await setDoc(doc(db, "leagueMembers", `${invite.leagueId}_${user.uid}`), {
    leagueId: invite.leagueId,
    userId: user.uid,
    userEmail: user.email,
    role: invite.role || "member",
    inviteId,
    joinedAt: serverTimestamp(),
  });

  await deleteDoc(doc(db, "leagueInvites", inviteId));
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

export async function inviteLeagueUser({ leagueId, email }) {
  const normalizedEmail = normalizeEmail(email);

  await setDoc(doc(db, "leagueInvites", `${leagueId}_${normalizedEmail}`), {
    leagueId,
    email: normalizedEmail,
    emailKey: normalizedEmail,
    role: "member",
    createdAt: serverTimestamp(),
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
          const leftKickoff = left.kickoff || "";
          const rightKickoff = right.kickoff || "";
          return leftKickoff.localeCompare(rightKickoff);
        });

      onData(matches);
    },
    onError
  );
}

export async function createLeagueMatch({ leagueId, teamA, teamB, venue, kickoff, userId }) {
  await addDoc(matchesCollection, {
    leagueId,
    teamA: teamA.trim(),
    teamB: teamB.trim(),
    venue: venue.trim(),
    kickoff: kickoff.trim(),
    createdByUid: userId,
    createdAt: serverTimestamp(),
  });
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
