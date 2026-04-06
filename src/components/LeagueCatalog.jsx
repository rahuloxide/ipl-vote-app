function LeagueCatalog({ leagues, requestedLeagueIds, onRequestJoin, isSubmitting }) {
  return (
    <section className="matches-section">
      <div className="section-heading">
        <div>
          <p className="section-label">Explore leagues</p>
          <h2>Join an existing league</h2>
        </div>
        <p className="section-copy">
          Browse available leagues and send a join request to the league owner.
        </p>
      </div>

      {leagues.length ? (
        <div className="league-catalog">
          {leagues.map((league) => {
            const hasRequested = requestedLeagueIds.includes(league.id);

            return (
              <article className="league-card" key={league.id}>
                <div>
                  <p className="league-card-name">{league.name}</p>
                  <p className="league-card-meta">Created by: {league.adminEmail}</p>
                  <p className="league-card-meta">Members: {league.members?.length || 0}</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => onRequestJoin(league.id)}
                  disabled={isSubmitting || hasRequested}
                >
                  {hasRequested ? "Request Pending" : "Request to Join"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="section-copy">No extra leagues are available to join right now.</p>
      )}
    </section>
  );
}

export default LeagueCatalog;
