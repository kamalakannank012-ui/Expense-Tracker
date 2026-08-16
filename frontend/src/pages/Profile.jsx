import { useEffect, useState } from "react";
import API from "../services/api";

function Profile() {
  const [user, setUser] = useState({});

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const getProfile = async () => {
      try {
        const res = await API.get("/auth/profile");

        setUser(res.data);
        setName(res.data.name || "");
        setEmail(res.data.email || "");
      } catch (err) {
        console.log(err);

        setError(
          err.response?.data?.message ||
          "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setSaving(true);

      const res = await API.put("/auth/profile", {
        name: name.trim(),
        email: email.trim(),
      });

      setUser(res.data.user);

      setName(res.data.user.name);
      setEmail(res.data.user.email);

      // Update saved user information
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      setMessage("Profile updated successfully!");

      setEditing(false);

    } catch (err) {
      console.log("Update Profile Error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(user.name || "");
    setEmail(user.email || "");

    setError("");
    setMessage("");

    setEditing(false);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h4>Loading Profile...</h4>
      </div>
    );
  }

  return (
    <div className="container mt-5">

      <div className="card shadow">

        {/* Header */}
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">

          <h3 className="mb-0">
            👤 User Profile
          </h3>

          {!editing && (
            <button
              className="btn btn-light"
              onClick={() => {
                setMessage("");
                setError("");
                setEditing(true);
              }}
            >
              ✏️ Edit Profile
            </button>
          )}

        </div>

        <div className="card-body">

          {/* Success */}
          {message && (
            <div className="alert alert-success">
              ✅ {message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-danger">
              ❌ {error}
            </div>
          )}

          {!editing ? (

            <>
              {/* Name */}
              <div className="mb-4">
                <h5>Name</h5>

                <p className="form-control">
                  {user.name || "Not available"}
                </p>
              </div>

              {/* Email */}
              <div className="mb-4">
                <h5>Email</h5>

                <p className="form-control">
                  {user.email || "Not available"}
                </p>
              </div>
            </>

          ) : (

            <form onSubmit={handleUpdateProfile}>

              {/* Name */}
              <div className="mb-3">
                <label className="form-label">
                  Full Name
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label">
                  Email
                </label>

                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              {/* Buttons */}
              <div className="d-flex gap-2">

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "💾 Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

              </div>

            </form>

          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;