import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AppHeader from "./components/AppHeader";
import Dashboard from "./components/Dashboard";
import LeagueDetailPage from "./components/LeagueDetailPage";
import LoadingState from "./components/LoadingState";
import LoginCard from "./components/LoginCard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import { auth } from "./firebase";
import { ensureDefaultAdminLeague } from "./services/leagueService";
import {
  ensureUserDocument,
  getCurrentUserRole,
  isSuperAdmin,
  subscribeToCurrentUserRole,
} from "./services/userService";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedManagedLeagueId, setSelectedManagedLeagueId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await ensureUserDocument(user);
          const nextIsSuperAdmin = await isSuperAdmin();
          const nextUserRole = await getCurrentUserRole();
          setIsCurrentUserSuperAdmin(nextIsSuperAdmin);
          setCurrentUserRole(nextUserRole);

          if (!nextIsSuperAdmin && activeView === "superadmin") {
            setActiveView("dashboard");
          }

          if (nextUserRole === "admin") {
            const defaultLeague = await ensureDefaultAdminLeague(user);
            setSelectedManagedLeagueId(defaultLeague.id);
          } else {
            setSelectedManagedLeagueId("");

            if (activeView === "admin") {
              setActiveView("dashboard");
            }
          }
        } catch (error) {
          console.error("Unable to sync user profile", error);
        }
      } else {
        setIsCurrentUserSuperAdmin(false);
        setCurrentUserRole(null);
        setActiveView("dashboard");
        setSelectedManagedLeagueId("");
      }

      setAuthUser(user);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUser?.uid) {
      return undefined;
    }

    const unsubscribe = subscribeToCurrentUserRole(
      authUser.uid,
      (role) => {
        setCurrentUserRole(role);
        setIsCurrentUserSuperAdmin(role === "superadmin");

        if (role !== "admin" && activeView === "admin") {
          setActiveView("dashboard");
        }

        if (role !== "superadmin" && activeView === "superadmin") {
          setActiveView("dashboard");
        }
      },
      (error) => {
        console.error("Unable to subscribe to user role", error);
      }
    );

    return unsubscribe;
  }, [activeView, authUser?.uid]);

  useEffect(() => {
    if (currentUserRole !== "admin" || !authUser?.uid) {
      setSelectedManagedLeagueId("");
      return undefined;
    }

    let isActive = true;

    ensureDefaultAdminLeague(authUser)
      .then((league) => {
        if (isActive) {
          setSelectedManagedLeagueId(league.id);
        }
      })
      .catch((error) => {
        console.error("Unable to load admin workspace", error);
      });

    return () => {
      isActive = false;
    };
  }, [authUser, currentUserRole]);

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
          currentUserRole={currentUserRole}
          activeView={activeView}
          onChangeView={setActiveView}
        />

        {isAuthLoading ? (
          <LoadingState message="Checking your session..." />
        ) : authUser ? (
          activeView === "superadmin" && isCurrentUserSuperAdmin ? (
            <SuperAdminDashboard />
          ) : activeView === "admin" && currentUserRole === "admin" ? (
            <LeagueDetailPage
              leagueId={selectedManagedLeagueId}
              user={authUser}
            />
          ) : (
            <Dashboard user={authUser} currentUserRole={currentUserRole} />
          )
        ) : (
          <LoginCard />
        )}
      </section>
    </main>
  );
}

export default App;
