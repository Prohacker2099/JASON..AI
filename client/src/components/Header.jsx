import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <span className="logo-text">JASON</span>
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search devices, commands, or ask JASON..."
        />
        <button>
          <i className="icon">🔍</i>
        </button>
      </div>

      <div className="header-actions">
        <button className="action-button" onClick={toggleNotifications}>
          <i className="icon">🔔</i>
          <span className="badge">3</span>

          {showNotifications && (
            <div className="dropdown notifications-dropdown">
              <h3>Notifications</h3>
              <ul>
                <li>
                  <span className="notification-icon">🏠</span>
                  <div className="notification-content">
                    <p>Front door unlocked</p>
                    <span className="notification-time">2 minutes ago</span>
                  </div>
                </li>
                <li>
                  <span className="notification-icon">💡</span>
                  <div className="notification-content">
                    <p>Living room lights turned on</p>
                    <span className="notification-time">15 minutes ago</span>
                  </div>
                </li>
                <li>
                  <span className="notification-icon">🔄</span>
                  <div className="notification-content">
                    <p>New device connected: Smartphone</p>
                    <span className="notification-time">1 hour ago</span>
                  </div>
                </li>
              </ul>
              <div className="dropdown-footer">
                <Link to="/notifications">View all notifications</Link>
              </div>
            </div>
          )}
        </button>

        <button className="action-button" onClick={toggleUserMenu}>
          <div className="user-avatar">JS</div>

          {showUserMenu && (
            <div className="dropdown user-dropdown">
              <div className="user-info">
                <div className="user-avatar large">JS</div>
                <div>
                  <h3>John Smith</h3>
                  <p>john.smith@example.com</p>
                </div>
              </div>
              <ul>
                <li>
                  <Link to="/profile">
                    <i className="icon">👤</i> Profile
                  </Link>
                </li>
                <li>
                  <Link to="/settings">
                    <i className="icon">⚙️</i> Settings
                  </Link>
                </li>
                <li>
                  <Link to="/help">
                    <i className="icon">❓</i> Help & Support
                  </Link>
                </li>
                <li className="divider"></li>
                <li>
                  <Link to="/logout">
                    <i className="icon">🚪</i> Sign Out
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </button>
      </div>

      <style jsx>{`
        .header {
          height: 60px;
          background-color: #fff;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          align-items: center;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .logo {
          margin-right: 20px;
        }

        .logo a {
          text-decoration: none;
        }

        .logo-text {
          font-size: 24px;
          font-weight: bold;
          background: linear-gradient(45deg, #0070f3, #00c9ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-bar {
          flex: 1;
          max-width: 600px;
          display: flex;
          margin: 0 20px;
        }

        .search-bar input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #eaeaea;
          border-radius: 4px 0 0 4px;
          font-size: 14px;
        }

        .search-bar button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          padding: 0 15px;
          cursor: pointer;
        }

        .header-actions {
          display: flex;
          align-items: center;
        }

        .action-button {
          background: none;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
          cursor: pointer;
          position: relative;
        }

        .action-button:hover {
          background-color: #f5f5f5;
        }

        .badge {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #ff3e00;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #0070f3;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .user-avatar.large {
          width: 50px;
          height: 50px;
          font-size: 18px;
        }

        .dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 300px;
          z-index: 100;
        }

        .notifications-dropdown h3,
        .user-dropdown h3 {
          margin: 0;
          padding: 15px;
          border-bottom: 1px solid #eaeaea;
          font-size: 16px;
        }

        .notifications-dropdown ul,
        .user-dropdown ul {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
        }

        .notifications-dropdown li {
          padding: 10px 15px;
          border-bottom: 1px solid #f5f5f5;
          display: flex;
          align-items: center;
        }

        .notification-icon {
          margin-right: 10px;
          font-size: 20px;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content p {
          margin: 0;
          font-size: 14px;
        }

        .notification-time {
          font-size: 12px;
          color: #666;
        }

        .dropdown-footer {
          padding: 10px 15px;
          text-align: center;
          border-top: 1px solid #eaeaea;
        }

        .dropdown-footer a {
          color: #0070f3;
          text-decoration: none;
          font-size: 14px;
        }

        .user-info {
          padding: 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #eaeaea;
        }

        .user-info > div:last-child {
          margin-left: 10px;
        }

        .user-info h3 {
          margin: 0;
          padding: 0;
          border: none;
        }

        .user-info p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #666;
        }

        .user-dropdown ul {
          padding: 5px 0;
        }

        .user-dropdown li {
          padding: 0;
        }

        .user-dropdown li a {
          padding: 10px 15px;
          display: flex;
          align-items: center;
          color: #333;
          text-decoration: none;
          transition: background-color 0.3s;
        }

        .user-dropdown li a:hover {
          background-color: #f5f5f5;
        }

        .user-dropdown li.divider {
          height: 1px;
          background-color: #eaeaea;
          margin: 5px 0;
        }

        .user-dropdown .icon {
          margin-right: 10px;
        }
      `}</style>
    </header>
  );
};

export default Header;
