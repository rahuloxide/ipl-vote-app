import { useEffect, useState } from "react";

const STORAGE_KEY = "ipl-vote-app-counts";
const DEFAULT_COUNTS = {
  csk: 0,
  mi: 0,
};

function App() {
  const [votes, setVotes] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_COUNTS;
    }

    const savedVotes = window.localStorage.getItem(STORAGE_KEY);

    if (!savedVotes) {
      return DEFAULT_COUNTS;
    }

    try {
      const parsedVotes = JSON.parse(savedVotes);
      return {
        csk: Number(parsedVotes.csk) || 0,
        mi: Number(parsedVotes.mi) || 0,
      };
    } catch {
      return DEFAULT_COUNTS;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsedVotes = JSON.parse(event.newValue);
        setVotes({
          csk: Number(parsedVotes.csk) || 0,
          mi: Number(parsedVotes.mi) || 0,
        });
      } catch {
        setVotes(DEFAULT_COUNTS);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const totalVotes = votes.csk + votes.mi;

  const handleVote = (team) => {
    setVotes((currentVotes) => ({
      ...currentVotes,
      [team]: currentVotes[team] + 1,
    }));
  };

  return (
    <main className="app-shell">
      <section className="vote-card">
        <p className="eyebrow">IPL Vote App</p>
        <h1>CSK vs MI</h1>
        <p className="subtitle">Pick your team and watch the vote count update instantly.</p>

        <div className="actions">
          <button className="vote-button csk" onClick={() => handleVote("csk")}>
            Vote CSK
          </button>
          <button className="vote-button mi" onClick={() => handleVote("mi")}>
            Vote MI
          </button>
        </div>

        <div className="scoreboard">
          <article className="score-block">
            <span className="team-name">CSK</span>
            <strong>{votes.csk}</strong>
          </article>
          <article className="score-block">
            <span className="team-name">MI</span>
            <strong>{votes.mi}</strong>
          </article>
        </div>

        <p className="total-votes">Total votes: {totalVotes}</p>
      </section>
    </main>
  );
}

export default App;
