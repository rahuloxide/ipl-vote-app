import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AppHeader from "./components/AppHeader";
import Dashboard from "./components/Dashboard";
import LoadingState from "./components/LoadingState";
import LoginCard from "./components/LoginCard";
import { auth } from "./firebase";
import { ensureUserDocument, isSuperAdmin } from "./services/userService";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await ensureUserDocument(user);
          setIsCurrentUserSuperAdmin(await isSuperAdmin());
        } catch (error) {
          console.error("Unable to sync user profile", error);
        }
      } else {
        setIsCurrentUserSuperAdmin(false);
      }

      setAuthUser(user);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const greetingName = useMemo(() => {
    if (!authUser?.displayName) {
      return "IPL fan";
    }

    return authUser.displayName.split(" ")[0];
  }, [authUser]);

  return (
    <main className="app-shell">
      <section className="app-panel">
        <AppHeader
          isLoggedIn={Boolean(authUser)}
          greetingName={greetingName}
          isSuperAdminUser={isCurrentUserSuperAdmin}
        />

        {isAuthLoading ? (
          <LoadingState message="Checking your session..." />
        ) : authUser ? (
          <Dashboard user={authUser} />
        ) : (
          <LoginCard />
        )}
      </section>
    </main>
  );
}

export default App;
