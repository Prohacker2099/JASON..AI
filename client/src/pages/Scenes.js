"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var ScenesPanel_1 = require("@/components/ScenesPanel");
var CreateSceneModal_1 = require("@/components/CreateSceneModal");
var HeaderComponent_1 = require("@/components/HeaderComponent");
var FooterComponent_1 = require("@/components/FooterComponent");
var HolographicBackground_1 = require("@/components/HolographicBackground");
var ScenesPage = function () {
  var _a = (0, react_1.useState)(false),
    createModalOpen = _a[0],
    setCreateModalOpen = _a[1];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <HolographicBackground_1.default />
      <HeaderComponent_1.default />

      <main className="container mx-auto px-4 py-8">
        <framer_motion_1.motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <ScenesPanel_1.default
            onCreateScene={function () {
              return setCreateModalOpen(true);
            }}
          />
        </framer_motion_1.motion.div>
      </main>

      <FooterComponent_1.default />

      <CreateSceneModal_1.default
        isOpen={createModalOpen}
        onClose={function () {
          return setCreateModalOpen(false);
        }}
        onSceneCreated={function () {
          setCreateModalOpen(false);
          // The ScenesPanel will automatically refresh due to its internal state management
        }}
      />
    </div>
  );
};
exports.default = ScenesPage;
