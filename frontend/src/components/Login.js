import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link for navigation

function Login({ handleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // Step 1: Login, Step 2: OTP Verification

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("http://localhost:5000/login", { email, password });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/verify-otp", { email, otp });
      if (res.data.token) {
        const ONE_HOUR = 60 * 60 * 1000;
        const expiryTime = Date.now() + ONE_HOUR;
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("expiryTime", expiryTime.toString());
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        handleLogin();
      } else {
        setError("Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4 border-0 rounded" style={{ width: "380px" }}>
        <h2 className="text-center mb-3 text-primary fw-bold">Admin Login</h2>

        {error && (
          <div className="alert alert-danger text-center p-2 mb-3" style={{ fontSize: "14px" }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">Email</label>
              <input
                type="email"
                id="email"
                className="form-control shadow-sm"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <input
                type="password"
                id="password"
                className="form-control shadow-sm"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 shadow-sm fw-bold">
              Verify
            </button>

            {/* Forgot Password Link */}
            <div className="text-center mt-3">
              <Link to="/forgot-password" className="text-primary text-decoration-none fw-semibold">
                Forgot Password?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="mb-3">
              <label htmlFor="otp" className="form-label fw-semibold">Enter OTP</label>
              <input
                type="text"
                id="otp"
                className="form-control shadow-sm"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-success w-100 py-2 shadow-sm fw-bold">
              Submit OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;