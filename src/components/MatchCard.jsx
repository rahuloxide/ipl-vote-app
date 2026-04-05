function MatchCard({ match, selectedTeam, onPick, isSaving }) {
  const teamOptions = [match.teamA, match.teamB];

  return (
    <article className="match-card">
      <div className="match-topline">
        <span className="match-badge">{match.kickoff}</span>
        <span className="match-meta">{match.venue}</span>
      </div>

      <h3>
        {match.teamA} vs {match.teamB}
      </h3>

      <div className="match-actions">
        {teamOptions.map((team) => {
          const isActive = selectedTeam === team;

          return (
            <button
              key={team}
              className={`pick-button ${isActive ? "active" : ""}`}
              onClick={() => onPick(match.id, team)}
              disabled={isSaving}
            >
              {isActive ? `Selected: ${team}` : `Pick ${team}`}
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default MatchCard;
