function InvitesCard({ invites, onAcceptInvite, isSubmitting }) {
  if (!invites.length) {
    return null;
  }

  return (
    <section className="setup-card">
      <div>
        <p className="section-label">Invitations</p>
        <h2>You have league invites</h2>
        <p className="section-copy">Accept an invite to join a league and start making picks.</p>
      </div>

      <div className="invite-list">
        {invites.map((invite) => (
          <article className="invite-row" key={invite.id}>
            <div>
              <p className="invite-name">{invite.leagueName}</p>
              <p className="invite-meta">Role: {invite.role || "member"}</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => onAcceptInvite(invite)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Accept"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default InvitesCard;
