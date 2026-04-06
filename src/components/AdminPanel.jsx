import { useState } from "react";

function AdminPanel({
  league,
  members,
  pendingRequests,
  onInviteUser,
  onCreateMatch,
  onApproveRequest,
  onRejectRequest,
  isSaving,
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [formValues, setFormValues] = useState({
    teamA: "",
    teamB: "",
    venue: "",
    kickoff: "",
  });

  const handleInviteSubmit = async (event) => {
    event.preventDefault();

    if (!inviteEmail.trim()) {
      return;
    }

    await onInviteUser(inviteEmail);
    setInviteEmail("");
  };

  const handleMatchSubmit = async (event) => {
    event.preventDefault();

    const hasEmptyField = Object.values(formValues).some((value) => !value.trim());

    if (hasEmptyField) {
      return;
    }

    await onCreateMatch(formValues);
    setFormValues({
      teamA: "",
      teamB: "",
      venue: "",
      kickoff: "",
    });
  };

  const updateField = (fieldName, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  };

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <div>
          <p className="section-label">Admin controls</p>
          <h3>Invite players to {league.name}</h3>
        </div>

        <form className="inline-form" onSubmit={handleInviteSubmit}>
          <input
            className="text-input"
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="player@email.com"
          />
          <button className="secondary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Send invite"}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <div>
          <p className="section-label">Admin controls</p>
          <h3>Create a match</h3>
        </div>

        <form className="stack-form" onSubmit={handleMatchSubmit}>
          <div className="two-column-grid">
            <input
              className="text-input"
              type="text"
              value={formValues.teamA}
              onChange={(event) => updateField("teamA", event.target.value)}
              placeholder="Team A"
            />
            <input
              className="text-input"
              type="text"
              value={formValues.teamB}
              onChange={(event) => updateField("teamB", event.target.value)}
              placeholder="Team B"
            />
          </div>

          <div className="two-column-grid">
            <input
              className="text-input"
              type="text"
              value={formValues.venue}
              onChange={(event) => updateField("venue", event.target.value)}
              placeholder="Venue"
            />
            <input
              className="text-input"
              type="text"
              value={formValues.kickoff}
              onChange={(event) => updateField("kickoff", event.target.value)}
              placeholder="Apr 10, 7:30 PM"
            />
          </div>

          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Add match"}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <div>
          <p className="section-label">Join requests</p>
          <h3>{pendingRequests.length} pending request{pendingRequests.length === 1 ? "" : "s"}</h3>
        </div>

        {pendingRequests.length ? (
          <div className="request-list">
            {pendingRequests.map((request) => (
              <article className="request-row" key={request.id}>
                <div>
                  <p className="invite-name">{request.userEmail}</p>
                  <p className="invite-meta">Status: {request.status}</p>
                </div>

                <div className="request-actions">
                  <button
                    className="primary-button"
                    onClick={() => onApproveRequest(request)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Approve"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => onRejectRequest(request)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Reject"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="section-copy">No pending requests for this league right now.</p>
        )}
      </div>

      <div className="admin-card">
        <div>
          <p className="section-label">Members</p>
          <h3>{members.length + 1} people in this league</h3>
        </div>

        <div className="member-list">
          <div className="member-row">
            <span>{league.adminEmail}</span>
            <span className="role-pill">admin</span>
          </div>

          {members.map((member) => (
            <div className="member-row" key={member.id}>
              <span>{member.userEmail}</span>
              <span className="role-pill">{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
