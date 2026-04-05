import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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

  if (existingUser.role !== assignedRole) {
    await setDoc(
      userReference,
      {
        uid: user.uid,
        email: user.email,
        role: assignedRole,
      },
      { merge: true }
    );

    return {
      id: userSnapshot.id,
      ...existingUser,
      role: assignedRole,
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
