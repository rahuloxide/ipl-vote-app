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
                className={`nav-link ${activeView === "league-management" ? "active" : ""}`}
                onClick={() => onChangeView("league-management")}
              >
                League Management
              </button>
            ) : null}

            {currentUserRole === "admin" ? (
              <button
                className={`nav-link ${activeView === "league" ? "active" : ""}`}
                onClick={() => onChangeView("league")}
              >
                League
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

    </header>
  );
}

export default AppHeader;
