import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AppHeader from "./components/AppHeader";
import Dashboard from "./components/Dashboard";
import LoadingState from "./components/LoadingState";
import LoginCard from "./components/LoginCard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import { auth } from "./firebase";
import { ensureUserDocument, isSuperAdmin } from "./services/userService";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await ensureUserDocument(user);
          const nextIsSuperAdmin = await isSuperAdmin();
          setIsCurrentUserSuperAdmin(nextIsSuperAdmin);

          if (!nextIsSuperAdmin) {
            setActiveView("dashboard");
          }
        } catch (error) {
          console.error("Unable to sync user profile", error);
        }
      } else {
        setIsCurrentUserSuperAdmin(false);
        setActiveView("dashboard");
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
          activeView={activeView}
          onChangeView={setActiveView}
        />

        {isAuthLoading ? (
          <LoadingState message="Checking your session..." />
        ) : authUser ? (
          activeView === "superadmin" && isCurrentUserSuperAdmin ? (
            <SuperAdminDashboard />
          ) : (
            <Dashboard user={authUser} />
          )
        ) : (
          <LoginCard />
        )}
      </section>
    </main>
  );
}

export default App;
