import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function AppHeader({ isLoggedIn, greetingName, isSuperAdminUser, activeView, onChangeView }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">IPL League Center</p>
        <h1>Run a private IPL league with picks, members, and admin controls.</h1>
        <p className="subtitle">
          {isLoggedIn
            ? `Welcome back, ${greetingName}. Manage your league or lock in your match winners.`
            : "Sign in with Google to create a league, invite players, and make your picks."}
        </p>

        {isLoggedIn && isSuperAdminUser ? <p className="superadmin-badge">Super Admin</p> : null}
      </div>

      {isLoggedIn ? (
        <div className="header-actions">
          {isSuperAdminUser ? (
            <button
              className="secondary-button"
              onClick={() =>
                onChangeView(activeView === "superadmin" ? "dashboard" : "superadmin")
              }
            >
              {activeView === "superadmin" ? "Open Main App" : "Open Super Admin"}
            </button>
          ) : null}

          <button className="secondary-button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      ) : null}
    </header>
  );
}

export default AppHeader;
