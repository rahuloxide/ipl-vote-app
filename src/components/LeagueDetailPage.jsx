import { useEffect, useMemo, useState } from "react";
import {
  approveLeagueRequest,
  createLeagueMatch,
  createLeagueMatchesBulk,
  deleteLeagueMatch,
  rejectLeagueRequest,
  renameLeague,
  removeLeagueMember,
  saveLeagueMatchResult,
  subscribeToAllLeaguePicks,
  subscribeToLeague,
  subscribeToLeagueMatches,
  subscribeToLeagueMembers,
  subscribeToLeagueScores,
  subscribeToPendingLeagueRequests,
  updateLeagueMatch,
} from "../services/leagueService";

function formatDateTime(dateTime) {
  if (!dateTime) {
    return "-";
  }

  const parsedDate = new Date(dateTime);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateTime;
  }

  return parsedDate.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTokens(value) {
  return Number(value || 0).toFixed(2);
}

function toDateTimeInputValue(dateTime) {
  if (!dateTime) {
    return "";
  }

  const parsedDate = new Date(dateTime);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateTime;
  }

  const timezoneOffset = parsedDate.getTimezoneOffset();
  const localDate = new Date(parsedDate.getTime() - timezoneOffset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeDateTimeValue(dateTime) {
  const parsedDate = new Date(dateTime);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Use a valid date and time.");
  }

  return parsedDate.toISOString();
}

function parseCsvLine(line) {
  const values = [];
  let currentValue = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "\"") {
      if (isInsideQuotes && line[index + 1] === "\"") {
        currentValue += "\"";
        index += 1;
      } else {
        isInsideQuotes = !isInsideQuotes;
      }
    } else if (character === "," && !isInsideQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
    } else {
      currentValue += character;
    }
  }

  values.push(currentValue.trim());
  return values;
}

function isMatchCompleted(match) {
  const matchDateTime = match.dateTime || match.kickoff || "";
  const parsedDate = new Date(matchDateTime);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return Date.now() > parsedDate.getTime();
}

function getResultLabel(result) {
  if (!result) {
    return "TBD";
  }

  return result === "no result" ? "No Result" : result;
}

function getMatchIdentity(match) {
  return match.matchName || `${match.option1 || match.teamA} vs ${match.option2 || match.teamB}`;
}

function LeagueDetailPage({ leagueId, user, activeTab = "management" }) {
  const [league, setLeague] = useState(null);
  const [matches, setMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allPicks, setAllPicks] = useState([]);
  const [scores, setScores] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState("");
  const [formValues, setFormValues] = useState({
    matchName: "",
    dateTime: "",
    option1: "",
    option2: "",
  });
  const [leagueName, setLeagueName] = useState("");

  useEffect(() => {
    setLeagueName(league?.name || "");
  }, [league?.name]);

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

    const unsubscribeAllPicks = subscribeToAllLeaguePicks(
      leagueId,
      (nextPicks) => {
        setAllPicks(nextPicks);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league votes.");
      }
    );

    const unsubscribeScores = subscribeToLeagueScores(
      leagueId,
      (nextScores) => {
        setScores(nextScores);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league scores.");
      }
    );

    return () => {
      unsubscribeLeague();
      unsubscribeMatches();
      unsubscribeMembers();
      unsubscribePendingRequests();
      unsubscribeAllPicks();
      unsubscribeScores();
    };
  }, [leagueId]);

  const submitMatch = async () => {
    const hasEmptyField = Object.values(formValues).some((value) => !String(value).trim());

    if (hasEmptyField) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const normalizedDateTime = normalizeDateTimeValue(formValues.dateTime);

      if (editingMatchId) {
        await updateLeagueMatch({
          matchId: editingMatchId,
          matchName: formValues.matchName,
          dateTime: normalizedDateTime,
          option1: formValues.option1,
          option2: formValues.option2,
        });
      } else {
        await createLeagueMatch({
          leagueId,
          matchName: formValues.matchName,
          dateTime: normalizedDateTime,
          option1: formValues.option1,
          option2: formValues.option2,
          userId: user.uid,
        });
      }

      setFormValues({
        matchName: "",
        dateTime: "",
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

  const handleMatchSubmit = async (event) => {
    event.preventDefault();
    await submitMatch();
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const fileContents = await file.text();
      const rows = fileContents
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (rows.length < 2) {
        throw new Error("CSV must include a header row and at least one match row.");
      }

      const headers = parseCsvLine(rows[0]).map((header) => header.toLowerCase());
      const headerIndex = {
        matchName: headers.indexOf("match name"),
        dateTime: headers.indexOf("datetime"),
        option1: headers.indexOf("option1"),
        option2: headers.indexOf("option2"),
        result: headers.indexOf("result"),
      };

      const missingHeader = [headerIndex.matchName, headerIndex.dateTime, headerIndex.option1, headerIndex.option2]
        .some((value) => value === -1);

      if (missingHeader) {
        throw new Error("CSV headers must be: Match Name, DateTime, Option1, Option2. Result is optional.");
      }

      const parsedMatches = rows.slice(1).map((line, index) => {
        const values = parseCsvLine(line);
        const match = {
          matchName: values[headerIndex.matchName] || "",
          dateTime: normalizeDateTimeValue(values[headerIndex.dateTime] || ""),
          option1: values[headerIndex.option1] || "",
          option2: values[headerIndex.option2] || "",
          result: headerIndex.result === -1 ? "" : values[headerIndex.result] || "",
        };

        const hasEmptyField = [match.matchName, match.dateTime, match.option1, match.option2]
          .some((value) => !String(value).trim());

        if (hasEmptyField) {
          throw new Error(`CSV row ${index + 2} is missing required values.`);
        }

        return match;
      });

      await createLeagueMatchesBulk({
        leagueId,
        matches: parsedMatches,
        userId: user.uid,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to import matches from CSV.");
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

  const handleSaveResult = async (match, nextResult) => {
    const normalizedResult = nextResult || null;

    if ((match.result ?? null) === normalizedResult) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      await saveLeagueMatchResult({
        leagueId,
        matchId: match.id,
        result: normalizedResult,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to save this result.");
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
      matchName: getMatchIdentity(match),
      dateTime: toDateTimeInputValue(match.dateTime || match.kickoff || ""),
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

  const handleRenameLeague = async (event) => {
    event.preventDefault();

    const trimmedName = leagueName.trim();

    if (!league?.id || !trimmedName || trimmedName === league.name) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      await renameLeague({
        leagueId: league.id,
        name: trimmedName,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to rename this league.");
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

  const voteRows = useMemo(() => {
    const matchLookup = matches.reduce((accumulator, match) => {
      accumulator[match.id] = match;
      return accumulator;
    }, {});

    return allPicks
      .map((pick) => {
        const match = matchLookup[pick.matchId];
        return {
          id: pick.id,
          matchName:
            match?.matchName ||
            `${match?.option1 || match?.teamA || "Match"} vs ${match?.option2 || match?.teamB || ""}`,
          userEmail: pick.userEmail,
          selectedTeam: pick.selectedTeam,
          outcome: pick.outcome || (match?.result ? "pending settlement" : "open"),
          rewardTokens: pick.rewardTokens ?? 0,
        };
      })
      .sort((left, right) => {
        const matchCompare = left.matchName.localeCompare(right.matchName);
        if (matchCompare !== 0) {
          return matchCompare;
        }

        return left.userEmail.localeCompare(right.userEmail);
      });
  }, [allPicks, matches]);

  if (!league) {
    return (
      <section className="setup-card">
        <p className="section-copy">Select a league to manage it.</p>
      </section>
    );
  }

  return (
    <section className="league-detail-page">
      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

      {activeTab === "management" ? (
        <>
      <section className="admin-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Admin workspace</p>
            <h2>{league.name}</h2>
          </div>
          <p className="section-copy">
            Update the league name and manage setup details from here.
          </p>
        </div>

        <form className="rename-league-form" onSubmit={handleRenameLeague}>
          <input
            className="text-input"
            type="text"
            value={leagueName}
            onChange={(event) => setLeagueName(event.target.value)}
            placeholder="League name"
            disabled={isSaving}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={isSaving || !leagueName.trim() || leagueName.trim() === league.name}
          >
            {isSaving ? "Saving..." : "Rename league"}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <div>
            <p className="section-label">League matches</p>
            <h2>{league.name}</h2>
          </div>
          <p className="section-copy">
            Add, edit, delete, or bulk upload matches for this league.
          </p>
        </div>

        <div className="table-wrapper">
            <table className="simple-table matches-table">
             <thead>
               <tr>
                  <th>#</th>
                  <th>Match Name</th>
                  <th>DateTime</th>
                  <th className="choice-header" aria-label="Option 1"></th>
                  <th className="choice-header" aria-label="Option 2"></th>
                  <th className="choice-header" aria-label="To be decided"></th>
                  <th className="choice-header" aria-label="No result"></th>
                  <th className="choice-header" aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                  {matches.length ? (
                  matches.map((match, index) => {
                    const option1 = match.option1 || match.teamA || "-";
                    const option2 = match.option2 || match.teamB || "-";
                    const isCompleted = isMatchCompleted(match);
                    const isEditingRow = editingMatchId === match.id;

                    return (
                    <tr
                      key={match.id}
                      className={isCompleted ? "completed-match-row" : ""}
                    >
                    <td className="match-number-cell">{index + 1}</td>
                    <td>
                      {isEditingRow ? (
                        <input
                          className="text-input compact-input"
                          type="text"
                          value={formValues.matchName}
                          onChange={(event) => updateField("matchName", event.target.value)}
                        />
                      ) : (
                        getMatchIdentity(match)
                      )}
                    </td>
                    <td>
                      {isEditingRow ? (
                        <input
                          className="text-input compact-input"
                          type="datetime-local"
                          value={formValues.dateTime}
                          onChange={(event) => updateField("dateTime", event.target.value)}
                        />
                      ) : (
                        formatDateTime(match.dateTime || match.kickoff || "")
                      )}
                    </td>
                    <td>
                      {isEditingRow ? (
                        <input
                          className="text-input compact-input"
                          type="text"
                          value={formValues.option1}
                          onChange={(event) => updateField("option1", event.target.value)}
                        />
                      ) : (
                        <button
                          className={`pick-button table-pick-button ${match.result === option1 ? "active" : ""}`}
                          type="button"
                          onClick={() => handleSaveResult(match, option1)}
                          disabled={isSaving}
                        >
                          {option1}
                        </button>
                      )}
                    </td>
                    <td>
                      {isEditingRow ? (
                        <input
                          className="text-input compact-input"
                          type="text"
                          value={formValues.option2}
                          onChange={(event) => updateField("option2", event.target.value)}
                        />
                      ) : (
                        <button
                          className={`pick-button table-pick-button ${match.result === option2 ? "active" : ""}`}
                          type="button"
                          onClick={() => handleSaveResult(match, option2)}
                          disabled={isSaving}
                        >
                          {option2}
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        className={`secondary-button table-choice-button ${match.result == null ? "active" : ""}`}
                        type="button"
                        onClick={() => handleSaveResult(match, null)}
                        disabled={isSaving}
                      >
                        TBD
                      </button>
                    </td>
                    <td>
                      <button
                        className={`secondary-button result-reset-button ${match.result === "no result" ? "active" : ""}`}
                        type="button"
                        onClick={() => handleSaveResult(match, "no result")}
                        disabled={isSaving}
                      >
                        No Result
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        {isEditingRow ? (
                          <>
                            <button
                              className="link-button"
                              type="button"
                              onClick={submitMatch}
                              disabled={isSaving}
                            >
                              Save
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => {
                                setEditingMatchId("");
                                setFormValues({
                                  matchName: "",
                                  dateTime: "",
                                  option1: "",
                                  option2: "",
                                });
                              }}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button className="link-button" type="button" onClick={() => handleEditMatch(match)}>
                            Edit
                          </button>
                        )}
                        <button
                          className="icon-button danger-icon-button"
                          type="button"
                          aria-label={`Delete ${getMatchIdentity(match)}`}
                          onClick={() => handleDeleteMatch(match.id)}
                          disabled={isSaving}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 10h12l1-13H5l1 13Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
                ) : (
                  <tr>
                  <td colSpan="8">No matches added yet.</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {!editingMatchId ? (
        <form className="match-create-row" onSubmit={handleMatchSubmit}>
          <div className="match-create-grid">
            <span className="match-create-number">New</span>
            <input
              className="text-input compact-input"
              type="text"
              value={formValues.matchName}
              onChange={(event) => updateField("matchName", event.target.value)}
              placeholder="Match Name"
            />
            <input
              className="text-input compact-input"
              type="datetime-local"
              value={formValues.dateTime}
              onChange={(event) => updateField("dateTime", event.target.value)}
            />
            <input
              className="text-input compact-input"
              type="text"
              value={formValues.option1}
              onChange={(event) => updateField("option1", event.target.value)}
              placeholder="Option1"
            />
            <input
              className="text-input compact-input"
              type="text"
              value={formValues.option2}
              onChange={(event) => updateField("option2", event.target.value)}
              placeholder="Option2"
            />
            <span className="match-create-placeholder">TBD</span>
            <span className="match-create-placeholder">No Result</span>
            <div className="row-actions match-create-actions">
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </form>
        ) : null}

        <div className="csv-upload-card">
          <p className="section-label">Bulk upload</p>
          <p className="section-copy">
            Upload a CSV with columns: Match Name, DateTime, Option1, Option2. Result is optional.
          </p>
          <input
            className="text-input"
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            disabled={isSaving}
          />
        </div>
      </section>

        </>
      ) : null}

      {activeTab === "league" ? (
        <>
      <section className="admin-card">
        <div className="section-heading">
          <div>
            <p className="section-label">League overview</p>
            <h2>{league.name}</h2>
          </div>
          <p className="section-copy">
            Review rewards and voting performance for this league.
          </p>
        </div>
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Rewards</p>
            <h2>{league.name}</h2>
          </div>
          <p className="section-copy">
            League totals track wins, losses, and tokens earned so far.
          </p>
        </div>

        <div className="table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {scores.length ? (
                scores.map((score) => (
                  <tr key={score.id}>
                    <td>{score.userEmail}</td>
                    <td>{score.wins ?? 0}</td>
                    <td>{score.losses ?? 0}</td>
                    <td>{formatTokens(score.tokens ?? 0)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No rewards yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Votes</p>
            <h2>{league.name}</h2>
          </div>
          <p className="section-copy">Track every player vote and the reward outcome after settlement.</p>
        </div>

        <div className="table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>User</th>
                <th>Pick</th>
                <th>Outcome</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {voteRows.length ? (
                voteRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.matchName}</td>
                    <td>{row.userEmail}</td>
                    <td>{row.selectedTeam}</td>
                    <td>{row.outcome}</td>
                    <td>{formatTokens(row.rewardTokens)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No votes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

        </>
      ) : null}

      {activeTab === "management" ? (
        <>

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

        </>
      ) : null}
    </section>
  );
}

export default LeagueDetailPage;
