function LeagueSwitcher({ leagues, selectedLeagueId, onSelectLeague }) {
  if (!leagues.length) {
    return null;
  }

  return (
    <section className="switcher-card">
      <div>
        <p className="section-label">League</p>
        <h2>Your active league</h2>
      </div>

      <select
        className="select-input"
        value={selectedLeagueId}
        onChange={(event) => onSelectLeague(event.target.value)}
      >
        {leagues.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name}
          </option>
        ))}
      </select>
    </section>
  );
}

export default LeagueSwitcher;
