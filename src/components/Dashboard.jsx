import { useEffect, useState } from "react";
import LoadingState from "./LoadingState";
import MatchCard from "./MatchCard";
import {
  saveUserPick,
  seedMatchesIfEmpty,
  subscribeToMatches,
  subscribeToUserPicks,
} from "../services/matchService";

function Dashboard({ user }) {
  const [matches, setMatches] = useState([]);
  const [picks, setPicks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let matchesReady = false;
    let picksReady = false;

    const finishLoading = () => {
      if (matchesReady && picksReady) {
        setIsLoading(false);
      }
    };

    seedMatchesIfEmpty().catch((error) => {
      setErrorMessage(error.message || "Unable to prepare match data.");
      setIsLoading(false);
    });

    const unsubscribeMatches = subscribeToMatches(
      (nextMatches) => {
        setMatches(nextMatches);
        matchesReady = true;
        finishLoading();
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load matches.");
        setIsLoading(false);
      }
    );

    const unsubscribePicks = subscribeToUserPicks(
      user.uid,
      (nextPicks) => {
        setPicks(nextPicks);
        picksReady = true;
        finishLoading();
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load your picks.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeMatches();
      unsubscribePicks();
    };
  }, [user.uid]);

  const handlePick = async (matchId, selectedTeam) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await saveUserPick({
        userId: user.uid,
        matchId,
        selectedTeam,
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
          <p className="summary-label">Matches</p>
          <p className="summary-value">{matches.length}</p>
        </div>
      </div>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

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
  );
}

export default Dashboard;
