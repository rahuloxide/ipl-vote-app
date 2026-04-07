function MatchCard({ match, selectedTeam, onPick, isSaving }) {
  const option1 = match.option1 || match.teamA;
  const option2 = match.option2 || match.teamB;
  const teamOptions = [option1, option2];
  const matchTitle = match.matchName || `${option1} vs ${option2}`;
  const dateTime = match.dateTime || match.kickoff;
  const points = match.points ?? null;
  const isSettled = Boolean(match.winningOption);
  const deadlineEpochMs = Number(match.deadlineEpochMs);
  const hasValidDeadline = Number.isFinite(deadlineEpochMs) && deadlineEpochMs > 0;
  const isClosed = hasValidDeadline ? Date.now() >= deadlineEpochMs : false;
  const isDisabled = isSaving || isSettled || isClosed;

  return (
    <article className="match-card">
      <div className="match-topline">
        <span className="match-badge">{dateTime}</span>
        <span className="match-meta">{points !== null ? `${points} pts` : ""}</span>
      </div>

      <h3>{matchTitle}</h3>

      {isSettled ? <p className="inline-meta">Winner: {match.winningOption}</p> : null}
      {!isSettled && isClosed ? <p className="inline-meta match-status-closed">Closed</p> : null}

      <div className="match-actions">
        {teamOptions.map((team) => {
          const isActive = selectedTeam === team;

          return (
            <button
              key={team}
              className={`pick-button ${isActive ? "active" : ""}`}
              onClick={() => onPick(match.id, team)}
              disabled={isDisabled}
            >
              {isSettled
                ? team === match.winningOption
                  ? `Winner: ${team}`
                  : team
                : isClosed
                  ? "Closed"
                : isActive
                  ? `Selected: ${team}`
                  : `Pick ${team}`}
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default MatchCard;
