import React, { useState } from "react";
import axios from "axios";

const Settings = () => {
  const [step, setStep] = useState("request"); // "request" or "verify"
  const [email, setEmail] = useState(""); // Store admin email from response
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage after login

  // Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await axios.post(
        "http://localhost:5000/request-password-change",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmail(response.data.email);
      setMessage(response.data.message);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  // Verify OTP and Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await axios.post(
        "http://localhost:5000/change-password",
        { otp, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setStep("request");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-lg p-4 border-0 rounded">
            <h2 className="text-center mb-4 text-primary fw-bold">Change Password</h2>

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
                <p className="text-center text-muted mb-4">
                  Click below to receive an OTP to change your password.
                </p>
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 shadow-sm fw-bold"
                >
                  Request OTP
                </button>
              </form>
            ) : (
              /* Step 2: Verify OTP and Change Password */
              <form onSubmit={handleChangePassword}>
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
                  Change Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;