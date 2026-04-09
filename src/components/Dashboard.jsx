import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import LeagueCatalog from "./LeagueCatalog";
import LoadingState from "./LoadingState";
import MatchCard from "./MatchCard";
import { auth } from "../firebase";
import {
  getLeagueRole,
  requestToJoinLeague,
  saveLeaguePick,
  subscribeToAllLeagues,
  subscribeToLeagueMatches,
  subscribeToLeaguePicks,
  subscribeToLeagueScores,
  subscribeToUserLeagueRequests,
  subscribeToUserLeagues,
} from "../services/leagueService";

function formatTokens(value) {
  return Number(value || 0).toFixed(2);
}

function Dashboard({ user, currentUserRole, selectedLeagueId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("picks");
  const [errorMessage, setErrorMessage] = useState("");
  const [leagues, setLeagues] = useState([]);
  const [allLeagues, setAllLeagues] = useState([]);
  const [leagueRequests, setLeagueRequests] = useState([]);
  const [selectedLeagueRole, setSelectedLeagueRole] = useState(null);
  const [matches, setMatches] = useState([]);
  const [picks, setPicks] = useState({});
  const [leagueScores, setLeagueScores] = useState([]);

  useEffect(() => {
    const unsubscribeLeagues = subscribeToUserLeagues(
      user.uid,
      (nextLeagues) => {
        setLeagues(nextLeagues);
        setIsLoading(false);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load your leagues.");
        setIsLoading(false);
      }
    );

    const unsubscribeAllLeagues = subscribeToAllLeagues(
      (nextLeagues) => {
        setAllLeagues(nextLeagues);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league list.");
      }
    );

    const unsubscribeLeagueRequests = subscribeToUserLeagueRequests(
      user.uid,
      (nextRequests) => {
        setLeagueRequests(nextRequests);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load join requests.");
      }
    );

    return () => {
      unsubscribeLeagues();
      unsubscribeAllLeagues();
      unsubscribeLeagueRequests();
    };
  }, [user.uid]);

  useEffect(() => {
    if (!selectedLeagueId) {
      setMatches([]);
      setPicks({});
      setLeagueScores([]);
      setSelectedLeagueRole(null);
      return;
    }

    const unsubscribeMatches = subscribeToLeagueMatches(
      selectedLeagueId,
      (nextMatches) => {
        setMatches(nextMatches);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league matches.");
      }
    );

    const unsubscribePicks = subscribeToLeaguePicks(
      { leagueId: selectedLeagueId, userId: user.uid },
      (nextPicks) => {
        setPicks(nextPicks);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load your picks.");
      }
    );

    const unsubscribeLeagueScores = subscribeToLeagueScores(
      selectedLeagueId,
      (nextScores) => {
        setLeagueScores(nextScores);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league scores.");
      }
    );

    getLeagueRole({ leagueId: selectedLeagueId, userId: user.uid })
      .then((role) => {
        setSelectedLeagueRole(role);
      })
      .catch((error) => {
        setErrorMessage(error.message || "Unable to determine your league role.");
      });

    return () => {
      unsubscribeMatches();
      unsubscribePicks();
      unsubscribeLeagueScores();
    };
  }, [selectedLeagueId, user.uid]);

  const selectedLeague = useMemo(
    () => leagues.find((league) => league.id === selectedLeagueId) || null,
    [leagues, selectedLeagueId]
  );

  const requestedLeagueIds = useMemo(
    () => leagueRequests.filter((request) => request.status === "pending").map((request) => request.leagueId),
    [leagueRequests]
  );

  const browseableLeagues = useMemo(() => {
    const joinedLeagueIds = leagues.map((league) => league.id);

    return allLeagues.filter(
      (league) =>
        !joinedLeagueIds.includes(league.id) && !requestedLeagueIds.includes(league.id)
    );
  }, [allLeagues, leagues, requestedLeagueIds]);

  const performanceRows = useMemo(() => {
    if (!selectedLeague) {
      return [];
    }

    const roster = new Map();

    if (selectedLeague.adminUid) {
      roster.set(selectedLeague.adminUid, {
        userId: selectedLeague.adminUid,
        userEmail: selectedLeague.adminEmail || "Admin",
        role: "admin",
      });
    }

    leagueScores.forEach((score) => {
      roster.set(score.userId, {
        userId: score.userId,
        userEmail: score.userEmail,
      });
    });

    return Array.from(roster.values())
      .map((member) => {
        const score = leagueScores.find((item) => item.userId === member.userId) || {};
        const wins = Number(score.wins || 0);
        const losses = Number(score.losses || 0);
        const totalPicks = wins + losses;
        const missed = Math.max(matches.length - totalPicks, 0);
        const settledPicks = wins + losses;
        const accuracy = settledPicks ? Math.round((wins / settledPicks) * 100) : 0;

        return {
          userId: member.userId,
          userEmail: member.userEmail,
          tokens: Number(score.tokens || 0),
          wins,
          losses,
          missed,
          totalPicks,
          accuracy,
        };
      })
      .sort((left, right) => {
        if (right.tokens !== left.tokens) {
          return right.tokens - left.tokens;
        }

        if (right.wins !== left.wins) {
          return right.wins - left.wins;
        }

        return left.userEmail.localeCompare(right.userEmail);
      });
  }, [leagueScores, matches.length, selectedLeague]);

  const handleRequestJoin = async (leagueId) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await requestToJoinLeague({
        leagueId,
        userId: user.uid,
        userEmail: user.email,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to send this join request.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePick = async (matchId, selectedTeam) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await saveLeaguePick({
        leagueId: selectedLeagueId,
        matchId,
        selectedTeam,
        userId: user.uid,
        userEmail: user.email,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to save your pick.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  return (
    <section className="dashboard">
      <section className="home-topbar">
        <aside className="account-panel">
          <div className="account-panel-grid">
            <div>
              <p className="summary-label">Signed in as</p>
              <p className="summary-value">{user.email}</p>
            </div>
            <div>
              <p className="summary-label">App role</p>
              <p className="summary-value">{currentUserRole || "user"}</p>
            </div>
            <div>
              <p className="summary-label">Leagues</p>
              <p className="summary-value">{leagues.length}</p>
            </div>
            <div>
              <p className="summary-label">Pending requests</p>
              <p className="summary-value">{requestedLeagueIds.length}</p>
            </div>
            <div>
              <p className="summary-label">League role</p>
              <p className="summary-value">{selectedLeagueRole || "No league yet"}</p>
            </div>
            <div>
              <p className="summary-label">League members</p>
              <p className="summary-value">{selectedLeague?.members?.length || 0}</p>
            </div>
          </div>

          <button className="signout-button" onClick={() => signOut(auth)} type="button">
            Sign out
          </button>
        </aside>
      </section>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

      {!leagues.length ? (
        <section className="setup-card">
          <div>
            <p className="section-label">No leagues yet</p>
            <h2>You are not in a league yet</h2>
            <p className="section-copy">
              Browse the available leagues below and request to join one.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="matches-section">
            {activeTab === "picks" ? (
              <>
            <div className="section-heading">
              <div>
                <h2>{selectedLeague?.name || "League matches"}</h2>
              </div>
              <div className="home-section-actions">
                <p className="section-copy">
                  {matches.length
                    ? "Choose one winner per match. Your picks save instantly."
                    : "No matches yet. The admin can add the first fixture from the Admin page."}
                </p>
                <button className="secondary-button" type="button" onClick={() => setActiveTab("performance")}>
                  Performance
                </button>
              </div>
            </div>

            <div className="match-grid">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  selectedTeam={picks[match.id]}
                  onPick={handlePick}
                  isSaving={isSaving}
                />
              ))}
            </div>
              </>
            ) : (
              <>
                <div className="section-heading">
                  <div>
                    <h2>{selectedLeague?.name || "League standings"}</h2>
                  </div>
                  <div className="home-section-actions">
                    <p className="section-copy">
                      Track how the full league is doing so far, including tokens, wins, losses, missed picks, and hit rate.
                    </p>
                    <button className="secondary-button" type="button" onClick={() => setActiveTab("picks")}>
                      Back to Voting
                    </button>
                  </div>
                </div>

                <div className="table-wrapper performance-table-wrapper">
                  <table className="simple-table performance-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Tokens</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Missed</th>
                        <th>Picks</th>
                        <th>Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceRows.length ? (
                        performanceRows.map((row, index) => (
                          <tr
                            key={row.userId}
                            className={index === 0 ? "performance-row leader-row" : "performance-row"}
                          >
                            <td>{row.userEmail}</td>
                            <td>{formatTokens(row.tokens)}</td>
                            <td>{row.wins}</td>
                            <td>{row.losses}</td>
                            <td>{row.missed}</td>
                            <td>{row.totalPicks}</td>
                            <td>{row.accuracy}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7">No league performance data yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}

      <LeagueCatalog
        leagues={browseableLeagues}
        requestedLeagueIds={requestedLeagueIds}
        onRequestJoin={handleRequestJoin}
        isSubmitting={isSaving}
      />
    </section>
  );
}

export default Dashboard;
