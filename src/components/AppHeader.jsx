const buildTimestamp = __BUILD_TIMESTAMP__;

function AppHeader({
  isLoggedIn,
  greetingName,
  isSuperAdminUser,
  currentUserRole,
  activeView,
  onChangeView,
  homeLeagues,
  selectedHomeLeagueId,
  onSelectHomeLeague,
}) {
  const showNavigation = isLoggedIn;
  const showHomeLeagueSelector = activeView === "dashboard" && homeLeagues?.length;

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

            {showHomeLeagueSelector ? (
              <label className="nav-league-picker">
                <span className="nav-league-label">League</span>
                <select
                  className="nav-league-select"
                  value={selectedHomeLeagueId}
                  onChange={(event) => onSelectHomeLeague(event.target.value)}
                >
                  {homeLeagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

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
