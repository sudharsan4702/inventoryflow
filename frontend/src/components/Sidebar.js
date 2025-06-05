import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTachometerAlt, FaBoxOpen, FaClipboardList, FaSignOutAlt, FaChartBar, FaUsers, FaCog,FaHistory } from "react-icons/fa";
import "../App.css";

function Sidebar({ handleLogout }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        
        {/* Toggle Button - Always Visible */}
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>

        {/* Sidebar Content */}
        <h2 className="text-center border-bottom pb-3">Admin Panel</h2>

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link to="/" className={`nav-link text-white ${location.pathname === "/" ? "active-link" : ""}`}>
              <FaTachometerAlt className="me-2" /> Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/orders" className={`nav-link text-white ${location.pathname === "/orders" ? "active-link" : ""}`}>
              <FaClipboardList className="me-2" /> Orders
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/inventory" className={`nav-link text-white ${location.pathname === "/inventory" ? "active-link" : ""}`}>
              <FaBoxOpen className="me-2" /> Inventory
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/reports" className={`nav-link text-white ${location.pathname === "/reports" ? "active-link" : ""}`}>
              <FaChartBar className="me-2" /> Reports
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/activity-log" className={`nav-link text-white ${location.pathname === "/ActivityLog" ? "active-link" : ""}`}>
              <FaHistory className="me-2" /> Activity
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/settings" className={`nav-link text-white ${location.pathname === "/settings" ? "active-link" : ""}`}>
              <FaCog className="me-2" /> Settings
            </Link>
          </li>
        </ul>

        {/* Logout Button */}
        <button className="btn btn-danger w-100 mt-auto" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </button>
      </div>
    </>
  );
}

export default Sidebar;
