import { useEffect, useState } from "react";
import { makeUserAdmin, subscribeToAllUsers } from "../services/userService";

function SuperAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setIsLoading(false);
      },
      (error) => {
        setErrorMessage(error.message || "Unable to load users.");
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleMakeAdmin = async (userId) => {
    setErrorMessage("");
    setIsSaving(true);

    try {
      await makeUserAdmin(userId);
    } catch (error) {
      setErrorMessage(error.message || "Unable to update this user.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="superadmin-page">
      <div className="section-heading">
        <div>
          <p className="section-label">Super Admin</p>
          <h2>User management</h2>
        </div>
        <p className="section-copy">Review every user account and promote trusted users to admin.</p>
      </div>

      {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}

      <section className="users-card">
        {isLoading ? (
          <p className="section-copy">Loading users...</p>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <article className="user-row" key={user.id}>
                <div>
                  <p className="user-email">{user.email}</p>
                  <p className="user-role">Role: {user.role}</p>
                </div>

                {user.role === "admin" || user.role === "superadmin" ? (
                  <span className="role-pill">{user.role}</span>
                ) : (
                  <button
                    className="secondary-button"
                    onClick={() => handleMakeAdmin(user.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Updating..." : "Make Admin"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default SuperAdminDashboard;
