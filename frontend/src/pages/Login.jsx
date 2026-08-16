import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Check fields
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      // Save login information
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      // Go to Dashboard
      navigate("/dashboard");

    } catch (err) {
      console.log("Login Error:", err);

      setError(
        err.response?.data?.message ||
        "Login failed. Please check your email and password."
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

        {/* Header */}
        <div className="card-header bg-dark text-white text-center">
          <h3 className="mb-0">
            🔐 Login
          </h3>
        </div>

        <div className="card-body p-4">

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
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
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-dark w-100"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          {/* Register */}
          <p className="text-center mt-4 mb-0">
            Don't have an account?{" "}

            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Login;