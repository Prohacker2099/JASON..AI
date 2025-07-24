import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>JASON</h3>
        <p>The Omnipotent AI Architect</p>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className={path === "/" ? "active" : ""}>
            <Link to="/">
              <i className="icon">📊</i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={path === "/devices" ? "active" : ""}>
            <Link to="/devices">
              <i className="icon">🏠</i>
              <span>Smart Home</span>
            </Link>
          </li>
          <li className={path === "/cross-device" ? "active" : ""}>
            <Link to="/cross-device">
              <i className="icon">🔄</i>
              <span>Cross-Device</span>
              <span className="new-badge">New</span>
            </Link>
          </li>
          <li className={path === "/voice" ? "active" : ""}>
            <Link to="/voice">
              <i className="icon">🎤</i>
              <span>Voice Control</span>
            </Link>
          </li>
          <li className={path === "/automations" ? "active" : ""}>
            <Link to="/automations">
              <i className="icon">⚙️</i>
              <span>Automations</span>
            </Link>
          </li>
          <li className={path === "/ai" ? "active" : ""}>
            <Link to="/ai">
              <i className="icon">🧠</i>
              <span>AI Lab</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link to="/settings" className={path === "/settings" ? "active" : ""}>
          <i className="icon">⚙️</i>
          <span>Settings</span>
        </Link>
        <Link to="/help" className={path === "/help" ? "active" : ""}>
          <i className="icon">❓</i>
          <span>Help</span>
        </Link>
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          background-color: #1a1a2e;
          color: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid #2d2d42;
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 24px;
          background: linear-gradient(45deg, #0070f3, #00c9ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-header p {
          font-size: 12px;
          margin: 5px 0 0;
          opacity: 0.7;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
        }

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-nav li {
          margin-bottom: 5px;
        }

        .sidebar-nav li a,
        .sidebar-footer a {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          color: #fff;
          text-decoration: none;
          transition: all 0.3s;
          border-left: 3px solid transparent;
          position: relative;
        }

        .sidebar-nav li a:hover,
        .sidebar-footer a:hover {
          background-color: #2d2d42;
          border-left-color: #0070f3;
        }

        .sidebar-nav li.active a,
        .sidebar-footer a.active {
          background-color: #2d2d42;
          border-left-color: #0070f3;
          font-weight: bold;
        }

        .icon {
          margin-right: 10px;
          font-size: 18px;
        }

        .new-badge {
          position: absolute;
          right: 10px;
          background-color: #0070f3;
          border-radius: 10px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: bold;
        }

        .sidebar-footer {
          padding: 20px 0;
          border-top: 1px solid #2d2d42;
          display: flex;
          flex-direction: column;
        }

        .sidebar-footer a {
          padding: 10px 20px;
          color: #fff;
          text-decoration: none;
          display: flex;
          align-items: center;
          opacity: 0.7;
          transition: opacity 0.3s;
        }

        .sidebar-footer a:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
