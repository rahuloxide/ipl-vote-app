import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function LoginCard() {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();

    resetFormFeedback();
    setIsSubmitting(true);

    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage("Account created. You are now signed in.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to continue right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    resetFormFeedback();

    if (!email.trim()) {
      setErrorMessage("Enter your email address first, then try password reset.");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage("Password reset email sent.");
    } catch (error) {
      setErrorMessage(error.message || "Unable to send reset email right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-card">
      <div className="login-copy">
        <span className="pill">Firebase Auth</span>
        <h2>Email/password or Google login</h2>
        <p>
          Sign in to join your league, manage matches, and save winner selections in Firestore.
        </p>
      </div>

      <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
        <button
          className={`nav-link ${authMode === "login" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("login");
            resetFormFeedback();
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`nav-link ${authMode === "signup" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("signup");
            resetFormFeedback();
          }}
          type="button"
        >
          Create Account
        </button>
      </div>

      <form className="stack-form auth-form" onSubmit={handleEmailAuth}>
        <input
          className="text-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
        />
        <input
          className="text-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete={authMode === "signup" ? "new-password" : "current-password"}
        />

        <div className="row-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Working..."
              : authMode === "signup"
                ? "Create Account"
                : "Sign In"}
          </button>

          {authMode === "login" ? (
            <button
              className="link-button"
              type="button"
              onClick={handlePasswordReset}
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          ) : null}
        </div>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button className="secondary-button" onClick={handleGoogleLogin} disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Continue with Google"}
      </button>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
      {successMessage ? <p className="inline-success">{successMessage}</p> : null}
    </section>
  );
}

export default LoginCard;
