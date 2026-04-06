import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./AdminPanel";
import InvitesCard from "./InvitesCard";
import LeagueSwitcher from "./LeagueSwitcher";
import LoadingState from "./LoadingState";
import MatchCard from "./MatchCard";
import {
  acceptLeagueInvite,
  createLeagueMatch,
  getLeagueRole,
  inviteLeagueUser,
  saveLeaguePick,
  subscribeToLeagueInvites,
  subscribeToLeagueMatches,
  subscribeToLeagueMembers,
  subscribeToLeaguePicks,
  subscribeToUserLeagues,
} from "../services/leagueService";

function Dashboard({ user, currentUserRole }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [leagues, setLeagues] = useState([]);
  const [invites, setInvites] = useState([]);
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

    const unsubscribeInvites = subscribeToLeagueInvites(
      user.email,
      (nextInvites) => {
        setInvites(nextInvites);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load your league invites.");
      }
    );

    return () => {
      unsubscribeLeagues();
      unsubscribeInvites();
    };
  }, [user.email, user.uid]);

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

  const isAdmin = selectedLeagueRole === "admin";

  const handleAcceptInvite = async (invite) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await acceptLeagueInvite({
        inviteId: invite.id,
        invite,
        user,
      });
      setSelectedLeagueId(invite.leagueId);
    } catch (error) {
      setErrorMessage(error.message || "Unable to join this league.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteUser = async (email) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await inviteLeagueUser({
        leagueId: selectedLeagueId,
        email,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to send this invite.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMatch = async ({ teamA, teamB, venue, kickoff }) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await createLeagueMatch({
        leagueId: selectedLeagueId,
        teamA,
        teamB,
        venue,
        kickoff,
        userId: user.uid,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to create this match.");
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
          <p className="summary-label">Leagues</p>
          <p className="summary-value">{leagues.length}</p>
        </div>
      </div>

      <div className="dashboard-summary">
        <div>
          <p className="summary-label">App role</p>
          <p className="summary-value">{currentUserRole || "user"}</p>
        </div>
        <div>
          <p className="summary-label">Pending invites</p>
          <p className="summary-value">{invites.length}</p>
        </div>
        <div>
          <p className="summary-label">League role</p>
          <p className="summary-value">{selectedLeagueRole || "No league yet"}</p>
        </div>
        <div>
          <p className="summary-label">Matches in league</p>
          <p className="summary-value">{matches.length}</p>
        </div>
      </div>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

      <InvitesCard invites={invites} onAcceptInvite={handleAcceptInvite} isSubmitting={isSaving} />

      {!leagues.length ? (
        <section className="setup-card">
          <div>
            <p className="section-label">No leagues yet</p>
            <h2>You are not in a league yet</h2>
            <p className="section-copy">
              Accept an invite from a league admin, or if you have the admin role use the Create
              League page from the header.
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

          {isAdmin && selectedLeague ? (
            <AdminPanel
              league={selectedLeague}
              members={members}
              onInviteUser={handleInviteUser}
              onCreateMatch={handleCreateMatch}
              isSaving={isSaving}
            />
          ) : null}

          <section className="matches-section">
            <div className="section-heading">
              <div>
                <p className="section-label">Match picks</p>
                <h2>{selectedLeague?.name || "League matches"}</h2>
              </div>
              <p className="section-copy">
                {matches.length
                  ? "Choose one winner per match. Your picks save instantly."
                  : "No matches yet. The league admin can add the first fixture."}
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
    </section>
  );
}

export default Dashboard;
