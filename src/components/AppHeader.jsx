import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const buildTimestamp = __BUILD_TIMESTAMP__;

function AppHeader({
  isLoggedIn,
  greetingName,
  isSuperAdminUser,
  currentUserRole,
  activeView,
  onChangeView,
  hasManagedLeague,
  onOpenUsersView,
}) {
  const showNavigation = isLoggedIn;

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">IPL Admin Center</p>
        <h1>Run a private IPL league with one admin workspace and clean match controls.</h1>
        <p className="subtitle">
          {isLoggedIn
            ? `Welcome back, ${greetingName}. Manage your admin workspace or lock in your match winners.`
            : "Sign in with Google to request league access and make your picks."}
        </p>

        <p className="build-stamp">Build: {buildTimestamp}</p>

        {isLoggedIn && isSuperAdminUser ? <p className="superadmin-badge">Super Admin</p> : null}

        {showNavigation ? (
          <nav className="nav-menu" aria-label="Primary">
            <button
              className={`nav-link ${activeView === "dashboard" ? "active" : ""}`}
              onClick={() => onChangeView("dashboard")}
            >
              Home
            </button>

            {currentUserRole === "admin" ? (
              <button
                className={`nav-link ${activeView === "admin" ? "active" : ""}`}
                onClick={() => onChangeView("admin")}
              >
                Admin
              </button>
            ) : null}

            {currentUserRole === "admin" && hasManagedLeague ? (
              <button
                className={`nav-link ${activeView === "admin" ? "active" : ""}`}
                onClick={onOpenUsersView}
              >
                Users
              </button>
            ) : null}

            {isSuperAdminUser ? (
              <button
                className={`nav-link ${activeView === "superadmin" ? "active" : ""}`}
                onClick={() => onChangeView("superadmin")}
              >
                Super Admin
              </button>
            ) : null}
          </nav>
        ) : null}
      </div>

      {isLoggedIn ? (
        <div className="header-actions">
          <button className="secondary-button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      ) : null}
    </header>
  );
}

export default AppHeader;
