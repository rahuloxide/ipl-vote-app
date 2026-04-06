import { useEffect, useMemo, useState } from "react";
import {
  approveLeagueRequest,
  createLeagueMatch,
  deleteLeagueMatch,
  rejectLeagueRequest,
  removeLeagueMember,
  subscribeToLeague,
  subscribeToLeagueMatches,
  subscribeToLeagueMembers,
  subscribeToPendingLeagueRequests,
  updateLeagueMatch,
} from "../services/leagueService";

function LeagueDetailPage({ leagueId, section, user }) {
  const [league, setLeague] = useState(null);
  const [matches, setMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState("");
  const [formValues, setFormValues] = useState({
    matchName: "",
    dateTime: "",
    points: "",
    option1: "",
    option2: "",
  });

  useEffect(() => {
    if (!leagueId) {
      return undefined;
    }

    const unsubscribeLeague = subscribeToLeague(
      leagueId,
      (nextLeague) => {
        setLeague(nextLeague);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load this league.");
      }
    );

    const unsubscribeMatches = subscribeToLeagueMatches(
      leagueId,
      (nextMatches) => {
        setMatches(nextMatches);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league matches.");
      }
    );

    const unsubscribeMembers = subscribeToLeagueMembers(
      leagueId,
      (nextMembers) => {
        setMembers(nextMembers);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league members.");
      }
    );

    const unsubscribePendingRequests = subscribeToPendingLeagueRequests(
      leagueId,
      (nextRequests) => {
        setPendingRequests(nextRequests);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load pending requests.");
      }
    );

    return () => {
      unsubscribeLeague();
      unsubscribeMatches();
      unsubscribeMembers();
      unsubscribePendingRequests();
    };
  }, [leagueId]);

  const sectionOrder = useMemo(
    () => (section === "users" ? ["users", "matches"] : ["matches", "users"]),
    [section]
  );

  const handleMatchSubmit = async (event) => {
    event.preventDefault();

    const hasEmptyField = Object.values(formValues).some((value) => !String(value).trim());

    if (hasEmptyField) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      if (editingMatchId) {
        await updateLeagueMatch({
          matchId: editingMatchId,
          matchName: formValues.matchName,
          dateTime: formValues.dateTime,
          points: formValues.points,
          option1: formValues.option1,
          option2: formValues.option2,
        });
      } else {
        await createLeagueMatch({
          leagueId,
          matchName: formValues.matchName,
          dateTime: formValues.dateTime,
          points: formValues.points,
          option1: formValues.option1,
          option2: formValues.option2,
          userId: user.uid,
        });
      }

      setFormValues({
        matchName: "",
        dateTime: "",
        points: "",
        option1: "",
        option2: "",
      });
      setEditingMatchId("");
    } catch (error) {
      setErrorMessage(error.message || "Unable to save this match.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveRequest = async (request) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await approveLeagueRequest({
        leagueId: request.leagueId,
        requestId: request.id,
        userId: request.userId,
        userEmail: request.userEmail,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to approve this request.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectRequest = async (request) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await rejectLeagueRequest(request.id);
    } catch (error) {
      setErrorMessage(error.message || "Unable to reject this request.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await deleteLeagueMatch(matchId);
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete this match.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatchId(match.id);
    setFormValues({
      matchName: match.matchName || `${match.option1 || match.teamA} vs ${match.option2 || match.teamB}`,
      dateTime: match.dateTime || match.kickoff || "",
      points: String(match.points ?? ""),
      option1: match.option1 || match.teamA || "",
      option2: match.option2 || match.teamB || "",
    });
  };

  const handleRemoveMember = async (member) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await removeLeagueMember({
        leagueId,
        userId: member.userId,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to remove this member.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (fieldName, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  };

  if (!league) {
    return (
      <section className="setup-card">
        <p className="section-copy">Select a league to manage it.</p>
      </section>
    );
  }

  const matchesSection = (
    <section className="admin-card">
      <div className="section-heading">
        <div>
          <p className="section-label">League matches</p>
          <h2>{league.name}</h2>
        </div>
        <p className="section-copy">
          All matches are shown in a simple table. Add or edit matches using the form below.
        </p>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Match Name</th>
              <th>DateTime</th>
              <th>Points</th>
              <th>Option1</th>
              <th>Option2</th>
              <th>Manage Options</th>
            </tr>
          </thead>
          <tbody>
            {matches.length ? (
              matches.map((match) => (
                <tr key={match.id}>
                  <td>{match.matchName || `${match.option1 || match.teamA} vs ${match.option2 || match.teamB}`}</td>
                  <td>{match.dateTime || match.kickoff || "-"}</td>
                  <td>{match.points ?? "-"}</td>
                  <td>{match.option1 || match.teamA || "-"}</td>
                  <td>{match.option2 || match.teamB || "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="link-button" onClick={() => handleEditMatch(match)}>
                        Edit
                      </button>
                      <button
                        className="link-button danger-link"
                        onClick={() => handleDeleteMatch(match.id)}
                        disabled={isSaving}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No matches added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="stack-form" onSubmit={handleMatchSubmit}>
        <div className="two-column-grid">
          <input
            className="text-input"
            type="text"
            value={formValues.matchName}
            onChange={(event) => updateField("matchName", event.target.value)}
            placeholder="Match Name"
          />
          <input
            className="text-input"
            type="text"
            value={formValues.dateTime}
            onChange={(event) => updateField("dateTime", event.target.value)}
            placeholder="DateTime"
          />
        </div>

        <div className="two-column-grid">
          <input
            className="text-input"
            type="number"
            value={formValues.points}
            onChange={(event) => updateField("points", event.target.value)}
            placeholder="Points"
          />
          <input
            className="text-input"
            type="text"
            value={formValues.option1}
            onChange={(event) => updateField("option1", event.target.value)}
            placeholder="Option1"
          />
        </div>

        <div className="two-column-grid">
          <input
            className="text-input"
            type="text"
            value={formValues.option2}
            onChange={(event) => updateField("option2", event.target.value)}
            placeholder="Option2"
          />
        </div>

        <div className="row-actions">
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : editingMatchId ? "Update match" : "Add match"}
          </button>

          {editingMatchId ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setEditingMatchId("");
                setFormValues({
                  matchName: "",
                  dateTime: "",
                  points: "",
                  option1: "",
                  option2: "",
                });
              }}
              disabled={isSaving}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );

  const usersSection = (
    <section className="admin-card">
      <div className="section-heading">
        <div>
          <p className="section-label">League users</p>
          <h2>{league.name}</h2>
        </div>
        <p className="section-copy">
          Review join requests and manage the members already in this admin workspace.
        </p>
      </div>

      <div className="admin-card nested-card">
        <div>
          <p className="section-label">Pending requests</p>
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
                    onClick={() => handleApproveRequest(request)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Approve"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => handleRejectRequest(request)}
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

      <div className="member-list">
        <div className="member-row">
          <span>{league.adminEmail}</span>
          <span className="role-pill">admin</span>
        </div>

        {members.map((member) => (
          <div className="member-row" key={member.id}>
            <div>
              <span>{member.userEmail}</span>
              <p className="invite-meta">Role: {member.role}</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => handleRemoveMember(member)}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Remove user"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <section className="league-detail-page">
      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
      {sectionOrder.map((currentSection) =>
        currentSection === "users" ? usersSection : matchesSection
      )}
    </section>
  );
}

export default LeagueDetailPage;
