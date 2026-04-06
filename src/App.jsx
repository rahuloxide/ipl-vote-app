import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AdminLeaguesPage from "./components/AdminLeaguesPage";
import AppHeader from "./components/AppHeader";
import Dashboard from "./components/Dashboard";
import CreateLeaguePage from "./components/CreateLeaguePage";
import LeagueDetailPage from "./components/LeagueDetailPage";
import LoadingState from "./components/LoadingState";
import LoginCard from "./components/LoginCard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import { auth } from "./firebase";
import { subscribeToAdminCreatedLeagues } from "./services/leagueService";
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
  const [adminLeagues, setAdminLeagues] = useState([]);
  const [selectedManagedLeagueId, setSelectedManagedLeagueId] = useState("");
  const [managedLeagueSection, setManagedLeagueSection] = useState("matches");

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

          if (nextUserRole !== "admin" && activeView === "createLeague") {
            setActiveView("dashboard");
          }
        } catch (error) {
          console.error("Unable to sync user profile", error);
        }
      } else {
        setIsCurrentUserSuperAdmin(false);
        setCurrentUserRole(null);
        setActiveView("dashboard");
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

        if (role !== "admin" && activeView === "createLeague") {
          setActiveView("dashboard");
        }

        if (role !== "admin" && (activeView === "leagues" || activeView === "leagueDetail")) {
          setActiveView("dashboard");
          setSelectedManagedLeagueId("");
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
      setAdminLeagues([]);
      return undefined;
    }

    const unsubscribe = subscribeToAdminCreatedLeagues(
      authUser.uid,
      (leagues) => {
        setAdminLeagues(leagues);

        if (!selectedManagedLeagueId && leagues.length) {
          setSelectedManagedLeagueId(leagues[0].id);
        }
      },
      (error) => {
        console.error("Unable to load admin leagues", error);
      }
    );

    return unsubscribe;
  }, [authUser?.uid, currentUserRole, selectedManagedLeagueId]);

  useEffect(() => {
    if (!adminLeagues.length) {
      setSelectedManagedLeagueId("");
      return;
    }

    const stillExists = adminLeagues.some((league) => league.id === selectedManagedLeagueId);

    if (!stillExists) {
      setSelectedManagedLeagueId(adminLeagues[0].id);
    }
  }, [adminLeagues, selectedManagedLeagueId]);

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
          hasManagedLeague={Boolean(selectedManagedLeagueId)}
          onOpenUsersView={() => {
            setManagedLeagueSection("users");
            setActiveView("leagueDetail");
          }}
        />

        {isAuthLoading ? (
          <LoadingState message="Checking your session..." />
        ) : authUser ? (
          activeView === "superadmin" && isCurrentUserSuperAdmin ? (
            <SuperAdminDashboard />
          ) : activeView === "createLeague" && currentUserRole === "admin" ? (
            <CreateLeaguePage
              user={authUser}
              onCreated={(leagueId) => {
                setSelectedManagedLeagueId(leagueId);
                setManagedLeagueSection("matches");
                setActiveView("leagueDetail");
              }}
            />
          ) : activeView === "leagues" && currentUserRole === "admin" ? (
            <AdminLeaguesPage
              leagues={adminLeagues}
              onOpenLeague={(leagueId) => {
                setSelectedManagedLeagueId(leagueId);
                setManagedLeagueSection("matches");
                setActiveView("leagueDetail");
              }}
            />
          ) : activeView === "leagueDetail" && currentUserRole === "admin" ? (
            <LeagueDetailPage
              leagueId={selectedManagedLeagueId}
              section={managedLeagueSection}
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
