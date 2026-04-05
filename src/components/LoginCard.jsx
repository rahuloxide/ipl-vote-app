import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function LoginCard() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-card">
      <div className="login-copy">
        <span className="pill">Firebase Auth</span>
        <h2>One-click Google login</h2>
        <p>
          Sign in to create a league, invite players, manage matches, and save
          winner selections in Firestore.
        </p>
      </div>

      <button className="primary-button" onClick={handleGoogleLogin} disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Continue with Google"}
      </button>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  );
}

export default LoginCard;
