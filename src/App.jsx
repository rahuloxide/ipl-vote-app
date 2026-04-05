import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AppHeader from "./components/AppHeader";
import Dashboard from "./components/Dashboard";
import LoadingState from "./components/LoadingState";
import LoginCard from "./components/LoginCard";
import { auth } from "./firebase";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
        <AppHeader isLoggedIn={Boolean(authUser)} greetingName={greetingName} />

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
