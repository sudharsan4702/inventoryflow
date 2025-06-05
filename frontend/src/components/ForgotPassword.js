import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [step, setStep] = useState("request"); // "request" or "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await axios.post("http://localhost:5000/forgot-password", { email });
      setEmail(response.data.email);
      setMessage(response.data.message);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await axios.post("http://localhost:5000/reset-password", { email, otp, newPassword });
      setMessage(response.data.message);
      setStep("request");
      setEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4 border-0 rounded" style={{ width: "380px" }}>
        <h2 className="text-center mb-4 text-primary fw-bold">Forgot Password</h2>

        {/* Success/Error Messages */}
        {message && (
          <div className="alert alert-success text-center p-2 mb-3" style={{ fontSize: "14px" }}>
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-danger text-center p-2 mb-3" style={{ fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === "request" ? (
          <form onSubmit={handleRequestOtp}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold text-muted">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-control shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 shadow-sm fw-bold"
            >
              Request OTP
            </button>
          </form>
        ) : (
          /* Step 2: Reset Password */
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label htmlFor="otp" className="form-label fw-semibold text-muted">
                OTP (sent to {email})
              </label>
              <input
                type="text"
                id="otp"
                className="form-control shadow-sm"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label fw-semibold text-muted">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                className="form-control shadow-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-success w-100 py-2 shadow-sm fw-bold"
            >
              Reset Password
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="text-center mt-3">
          <Link to="/" className="text-primary text-decoration-none fw-semibold">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;