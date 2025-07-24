"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var framer_motion_1 = require("framer-motion");
var GlassmorphicCard_1 = require("../components/GlassmorphicCard");
var NotFound = function () {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <GlassmorphicCard_1.default className="p-8 max-w-md text-center">
        <framer_motion_1.motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-gray-300 mb-6">Page not found</p>
          <p className="text-gray-400 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <react_router_dom_1.Link
            to="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Return to Dashboard
          </react_router_dom_1.Link>
        </framer_motion_1.motion.div>
      </GlassmorphicCard_1.default>
    </div>
  );
};
exports.default = NotFound;
