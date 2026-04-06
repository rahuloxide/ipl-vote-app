function AdminLeaguesPage({ leagues, onOpenLeague }) {
  return (
    <section className="admin-leagues-page">
      <div className="section-heading">
        <div>
          <p className="section-label">Leagues</p>
          <h2>Your created leagues</h2>
        </div>
        <p className="section-copy">
          Open a league to manage matches, pending requests, and members.
        </p>
      </div>

      {leagues.length ? (
        <div className="league-catalog">
          {leagues.map((league) => (
            <article className="league-card" key={league.id}>
              <div>
                <p className="league-card-name">{league.name}</p>
                <p className="league-card-meta">Members: {league.members?.length || 0}</p>
              </div>

              <button className="link-button" onClick={() => onOpenLeague(league.id)}>
                Open league
              </button>
            </article>
          ))}
        </div>
      ) : (
        <section className="setup-card">
          <p className="section-copy">You have not created a league yet.</p>
        </section>
      )}
    </section>
  );
}

export default AdminLeaguesPage;
