import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Orders from "./components/Orders";
import Inventory from "./components/Inventory";
import Reports from "./components/Reports";
import Users from "./components/Users";
import Settings from "./components/Settings";
import ActivityLog from "./components/ActivityLog";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiryTime = localStorage.getItem("expiryTime");

    if (token && expiryTime) {
      const expiry = Number(expiryTime); // Convert string to number
      if (Date.now() > expiry) {
        handleLogout(); // Token expired -> Logout
      } else {
        setIsLoggedIn(true);
        autoLogout(expiry - Date.now()); // Set auto logout with remaining time
      }
    }
  }, []);

  const autoLogout = (timeUntilExpiry) => {
    setTimeout(() => {
      handleLogout();
    }, timeUntilExpiry);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    // No need to set token/expiry here; Login component handles it
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("expiryTime");
    setIsLoggedIn(false);
    // No need for window.location.reload(); React Router handles navigation
  };

  return (
    <Router>
      <div className="d-flex">
        {isLoggedIn && <Sidebar handleLogout={handleLogout} />}
        <div className="flex-grow-1 p-4">
          <Routes>
            {!isLoggedIn ? (
              <Route path="*" element={<Login handleLogin={handleLogin} />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
                
              </>
            )}
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;