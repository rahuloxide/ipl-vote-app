import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const SUPER_ADMIN_EMAIL = "rahul.jain.en@gmail.com";

function getAssignedRole(user) {
  if (!user?.email) {
    return "user";
  }

  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL ? "superadmin" : "user";
}

export async function ensureUserDocument(user) {
  if (!user?.uid || !user?.email) {
    return null;
  }

  const userReference = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userReference);
  const assignedRole = getAssignedRole(user);

  if (!userSnapshot.exists()) {
    await setDoc(userReference, {
      uid: user.uid,
      email: user.email,
      role: assignedRole,
      createdAt: serverTimestamp(),
    });

    return {
      uid: user.uid,
      email: user.email,
      role: assignedRole,
    };
  }

  const existingUser = userSnapshot.data();

  const nextRole = assignedRole === "superadmin" ? "superadmin" : existingUser.role || "user";

  if (existingUser.role !== nextRole) {
    await setDoc(
      userReference,
      {
        uid: user.uid,
        email: user.email,
        role: nextRole,
      },
      { merge: true }
    );

    return {
      id: userSnapshot.id,
      ...existingUser,
      role: nextRole,
    };
  }

  return {
    id: userSnapshot.id,
    ...existingUser,
  };
}

export async function getCurrentUserRole() {
  const currentUser = auth.currentUser;

  if (!currentUser?.uid) {
    return null;
  }

  const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data().role || "user";
}

export async function isSuperAdmin() {
  const role = await getCurrentUserRole();
  return role === "superadmin";
}

export function subscribeToCurrentUserRole(userId, onData, onError) {
  return onSnapshot(
    doc(db, "users", userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(snapshot.data().role || "user");
    },
    onError
  );
}

export function subscribeToAllUsers(onData, onError) {
  return onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const users = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .sort((left, right) => left.email.localeCompare(right.email));

      onData(users);
    },
    onError
  );
}

export async function makeUserAdmin(userId) {
  const userReference = doc(db, "users", userId);
  const userSnapshot = await getDoc(userReference);

  if (!userSnapshot.exists()) {
    throw new Error("User not found.");
  }

  await setDoc(
    userReference,
    {
      role: "admin",
    },
    { merge: true }
  );
}
