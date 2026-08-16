import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";

function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();

    // Check password match
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    // Check password length
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");

      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.log("Change Password Error:", err);

      toast.error(
        err.response?.data?.message ||
        "Unable to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">

      <div className="card shadow">

        <div className="card-header bg-dark text-white">
          <h3 className="mb-0">
            ⚙️ Settings
          </h3>
        </div>

        <div className="card-body">

          <h4>🔐 Change Password</h4>

          <form onSubmit={changePassword}>

            {/* Current Password */}
            <div className="mb-3">
              <label className="form-label">
                Current Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                disabled={loading}
              />
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label className="form-label">
                New Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <label className="form-label">
                Confirm New Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={loading}
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading
                ? "Changing Password..."
                : "🔐 Change Password"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Settings;