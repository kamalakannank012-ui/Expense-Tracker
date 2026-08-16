import { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to change password"
      );
    }
  };

  return (
    <div className="container mt-5">

      <div className="card shadow">

        <div className="card-header bg-dark text-white">
          <h3 className="mb-0">⚙️ Settings</h3>
        </div>

        <div className="card-body">

          <h4>🔐 Change Password</h4>

          <form onSubmit={changePassword}>

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
                required
              />
            </div>

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
                required
              />
            </div>

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
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success"
            >
              Change Password
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Settings;