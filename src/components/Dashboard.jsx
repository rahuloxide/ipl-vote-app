import { useEffect, useMemo, useState } from "react";
import LeagueCatalog from "./LeagueCatalog";
import LeagueSwitcher from "./LeagueSwitcher";
import LoadingState from "./LoadingState";
import MatchCard from "./MatchCard";
import {
  getLeagueRole,
  requestToJoinLeague,
  saveLeaguePick,
  subscribeToAllLeagues,
  subscribeToLeagueMatches,
  subscribeToLeagueMembers,
  subscribeToLeaguePicks,
  subscribeToUserLeagueRequests,
  subscribeToUserLeagues,
} from "../services/leagueService";

function Dashboard({ user, currentUserRole }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [leagues, setLeagues] = useState([]);
  const [allLeagues, setAllLeagues] = useState([]);
  const [leagueRequests, setLeagueRequests] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [selectedLeagueRole, setSelectedLeagueRole] = useState(null);
  const [matches, setMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [picks, setPicks] = useState({});

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
    if (!leagues.length) {
      setSelectedLeagueId("");
      return;
    }

    const selectedLeagueStillExists = leagues.some((league) => league.id === selectedLeagueId);

    if (!selectedLeagueStillExists) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues, selectedLeagueId]);

  useEffect(() => {
    if (!selectedLeagueId) {
      setMatches([]);
      setMembers([]);
      setPicks({});
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

    const unsubscribeMembers = subscribeToLeagueMembers(
      selectedLeagueId,
      (nextMembers) => {
        setMembers(nextMembers);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load league members.");
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

    getLeagueRole({ leagueId: selectedLeagueId, userId: user.uid })
      .then((role) => {
        setSelectedLeagueRole(role);
      })
      .catch((error) => {
        setErrorMessage(error.message || "Unable to determine your league role.");
      });

    return () => {
      unsubscribeMatches();
      unsubscribeMembers();
      unsubscribePicks();
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
      <div className="dashboard-summary">
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
          <p className="summary-value">{selectedLeague ? members.length + 1 : 0}</p>
        </div>
      </div>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

      {currentUserRole === "admin" && selectedLeague ? (
        <section className="setup-card">
          <div>
            <p className="section-label">Admin workspace</p>
            <h2>{selectedLeague.name}</h2>
            <p className="section-copy">
              This is your default admin league. Use the Admin navigation to manage matches,
              users, and join requests in one place.
            </p>
          </div>
        </section>
      ) : null}

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
          <LeagueSwitcher
            leagues={leagues}
            selectedLeagueId={selectedLeagueId}
            onSelectLeague={setSelectedLeagueId}
          />

          <section className="matches-section">
            <div className="section-heading">
              <div>
                <p className="section-label">Match picks</p>
                <h2>{selectedLeague?.name || "League matches"}</h2>
              </div>
              <p className="section-copy">
                {matches.length
                  ? "Choose one winner per match. Your picks save instantly."
                  : "No matches yet. The admin can add the first fixture from the Admin page."}
              </p>
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
