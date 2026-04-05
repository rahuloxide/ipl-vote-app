import { useState } from "react";

function CreateLeagueCard({ onCreateLeague, isSubmitting }) {
  const [leagueName, setLeagueName] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!leagueName.trim()) {
      return;
    }

    await onCreateLeague(leagueName);
    setLeagueName("");
  };

  return (
    <section className="setup-card">
      <div>
        <p className="section-label">Create a league</p>
        <h2>Start your IPL pool</h2>
        <p className="section-copy">
          Create a league, become the admin, and then invite other players by email.
        </p>
      </div>

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          className="text-input"
          type="text"
          value={leagueName}
          onChange={(event) => setLeagueName(event.target.value)}
          placeholder="League name"
        />
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create league"}
        </button>
      </form>
    </section>
  );
}

export default CreateLeagueCard;
