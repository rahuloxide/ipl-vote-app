import { useState } from "react";
import { createLeague } from "../services/leagueService";

function CreateLeaguePage({ user, onCreated }) {
  const [leagueName, setLeagueName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!leagueName.trim()) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const leagueId = await createLeague({
        name: leagueName,
        user,
      });

      setLeagueName("");
      onCreated(leagueId);
    } catch (error) {
      setErrorMessage(error.message || "Unable to create the league.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-league-page">
      <div className="section-heading">
        <div>
          <p className="section-label">Create League</p>
          <h2>Start a new league</h2>
        </div>
        <p className="section-copy">
          Admin users can create one league and become the league owner for match setup and
          invites.
        </p>
      </div>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

      <section className="setup-card">
        <form className="stack-form" onSubmit={handleSubmit}>
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
    </section>
  );
}

export default CreateLeaguePage;
