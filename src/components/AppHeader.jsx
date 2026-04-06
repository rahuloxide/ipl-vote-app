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
}) {
  const showNavigation = isLoggedIn;

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">IPL Admin Center</p>
        <h1>Manage your IPL league.</h1>
        <p className="subtitle">
          {isLoggedIn
            ? `Welcome back, ${greetingName}. Manage matches, members, and picks in one place.`
            : "Sign in to join a league or manage one as an admin."}
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
