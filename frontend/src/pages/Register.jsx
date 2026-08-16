import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check all fields
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // Check password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Check passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccess("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.log("Register Error:", err);

      setError(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div
        className="card shadow mx-auto"
        style={{ maxWidth: "500px" }}
      >
        <div className="card-header bg-dark text-white text-center">
          <h3 className="mb-0">Create Account</h3>
        </div>

        <div className="card-body p-4">

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister}>

            {/* Name */}
            <div className="mb-3">
              <label className="form-label">
                Full Name
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">
                Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <label className="form-label">
                Confirm Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={loading}
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="btn btn-dark w-100"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Register"}
            </button>

          </form>

          {/* Login */}
          <p className="text-center mt-4 mb-0">
            Already have an account?{" "}
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;