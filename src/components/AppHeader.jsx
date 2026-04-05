import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function AppHeader({ isLoggedIn, greetingName }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">IPL Pick Center</p>
        <h1>Pick Your IPL Winners</h1>
        <p className="subtitle">
          {isLoggedIn
            ? `Welcome back, ${greetingName}. Choose the team you think will win each match.`
            : "Sign in with Google to manage your IPL match predictions."}
        </p>
      </div>

      {isLoggedIn ? (
        <button className="secondary-button" onClick={() => signOut(auth)}>
          Sign out
        </button>
      ) : null}
    </header>
  );
}

export default AppHeader;
