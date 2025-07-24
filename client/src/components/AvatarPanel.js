"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AvatarPanel;
function AvatarPanel() {
  return (
    <div className="holographic-panel rounded-xl p-5 glow-border">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00FFFF]/10 to-[#FF0066]/10 rounded-lg"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00FFFF] to-[#FF0066] flex items-center justify-center mb-3 animate-float">
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-3xl font-bold text-[#00FFFF]">J</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-center mb-1">JASON</h3>
          <p className="text-sm text-gray-400 text-center mb-3">
            The Omnipotent AI Architect
          </p>

          <div className="w-full bg-[#1A1A1A]/40 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-[#00FFFF] to-[#FF0066] h-2 rounded-full"
              style={{ width: "85%" }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="bg-[#1A1A1A]/40 p-2 rounded-lg text-center">
              <i className="ri-brain-line text-lg text-[#00FFFF]"></i>
              <p className="text-xs mt-1">Neural</p>
            </div>
            <div className="bg-[#1A1A1A]/40 p-2 rounded-lg text-center">
              <i className="ri-shield-keyhole-line text-lg text-[#00FF00]"></i>
              <p className="text-xs mt-1">Security</p>
            </div>
            <div className="bg-[#1A1A1A]/40 p-2 rounded-lg text-center">
              <i className="ri-database-2-line text-lg text-[#FF0066]"></i>
              <p className="text-xs mt-1">Memory</p>
            </div>
          </div>

          <div className="w-full mt-4">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Learning Cycle</span>
              <span className="text-[#00FFFF]">Active</span>
            </div>
            <div className="rotating-circle">
              <svg width="100%" height="20" viewBox="0 0 100 20">
                <circle cx="10" cy="10" r="4" fill="#00FFFF" />
                <circle cx="25" cy="10" r="3" fill="#00FFFF" opacity="0.8" />
                <circle cx="40" cy="10" r="2" fill="#00FFFF" opacity="0.6" />
                <circle cx="55" cy="10" r="2" fill="#00FFFF" opacity="0.4" />
                <circle cx="70" cy="10" r="2" fill="#00FFFF" opacity="0.2" />
                <circle cx="85" cy="10" r="2" fill="#00FFFF" opacity="0.1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
