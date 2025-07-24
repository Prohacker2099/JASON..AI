"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var framer_motion_1 = require("framer-motion");
var EnhancedHeaderComponent = function () {
  var _a = (0, react_1.useState)(false),
    mobileMenuOpen = _a[0],
    setMobileMenuOpen = _a[1];
  var _b = (0, react_1.useState)(false),
    userMenuOpen = _b[0],
    setUserMenuOpen = _b[1];
  var navigate = (0, react_router_dom_1.useNavigate)();
  var handleLogout = function () {
    // Clear authentication token
    localStorage.removeItem("auth_token");
    // Redirect to login page
    navigate("/login");
  };
  var toggleMobileMenu = function () {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  var toggleUserMenu = function () {
    setUserMenuOpen(!userMenuOpen);
  };
  return (
    <framer_motion_1.motion.header
      className="backdrop-blur-md bg-black/30 border-b border-white/10 p-4 sticky top-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <react_router_dom_1.Link to="/" className="flex items-center group">
          <framer_motion_1.motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3 overflow-hidden"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <framer_motion_1.motion.span
              className="text-white font-bold text-xl"
              initial={{ y: 0 }}
              whileHover={{ y: -30 }}
              transition={{ duration: 0.3 }}
            >
              J
            </framer_motion_1.motion.span>
            <framer_motion_1.motion.span
              className="text-white font-bold text-xl absolute"
              initial={{ y: 30 }}
              whileHover={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              AI
            </framer_motion_1.motion.span>
          </framer_motion_1.motion.div>
          <span className="text-white font-bold text-xl group-hover:text-blue-300 transition-colors">
            JASON
          </span>
        </react_router_dom_1.Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            <li>
              <react_router_dom_1.Link
                to="/"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Dashboard
              </react_router_dom_1.Link>
            </li>
            <li>
              <react_router_dom_1.Link
                to="/devices"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 7H7v6h6V7z" />
                  <path
                    fillRule="evenodd"
                    d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                    clipRule="evenodd"
                  />
                </svg>
                Devices
              </react_router_dom_1.Link>
            </li>
            <li>
              <react_router_dom_1.Link
                to="/integrations"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Integrations
              </react_router_dom_1.Link>
            </li>
            <li>
              <react_router_dom_1.Link
                to="/data-insights"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Insights
              </react_router_dom_1.Link>
            </li>
            <li>
              <react_router_dom_1.Link
                to="/cloud-settings"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>
                Cloud
              </react_router_dom_1.Link>
            </li>
            <li>
              <react_router_dom_1.Link
                to="/roadmap"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Roadmap
              </react_router_dom_1.Link>
            </li>
            <li>
              <react_router_dom_1.Link
                to="/console"
                className="text-white hover:text-blue-300 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Console
              </react_router_dom_1.Link>
            </li>
          </ul>
        </nav>

        {/* User Menu */}
        <div className="relative hidden md:block">
          <framer_motion_1.motion.button
            className="flex items-center space-x-2 text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 transition-colors"
            onClick={toggleUserMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span>User</span>
            <svg
              className={"w-4 h-4 transition-transform ".concat(
                userMenuOpen ? "rotate-180" : "",
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </framer_motion_1.motion.button>

          <framer_motion_1.AnimatePresence>
            {userMenuOpen && (
              <framer_motion_1.motion.div
                className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-700"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <react_router_dom_1.Link
                  to="/settings"
                  className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                >
                  Settings
                </react_router_dom_1.Link>
                <react_router_dom_1.Link
                  to="/subscription"
                  className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                >
                  Subscription
                </react_router_dom_1.Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </framer_motion_1.motion.div>
            )}
          </framer_motion_1.AnimatePresence>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <framer_motion_1.AnimatePresence>
        {mobileMenuOpen && (
          <framer_motion_1.motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="mt-4 pb-2">
              <ul className="space-y-2">
                <li>
                  <react_router_dom_1.Link
                    to="/"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Dashboard
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/devices"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Devices
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/integrations"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Integrations
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/data-insights"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Insights
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/cloud-settings"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cloud
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/roadmap"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Roadmap
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/console"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Console
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <react_router_dom_1.Link
                    to="/settings"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Settings
                  </react_router_dom_1.Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-red-400 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </framer_motion_1.motion.div>
        )}
      </framer_motion_1.AnimatePresence>
    </framer_motion_1.motion.header>
  );
};
exports.default = EnhancedHeaderComponent;
