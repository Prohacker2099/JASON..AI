"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotificationPanel;
var react_1 = require("react");
function NotificationPanel(_a) {
  var notification = _a.notification,
    onClose = _a.onClose;
  var _b = (0, react_1.useState)(false),
    isVisible = _b[0],
    setIsVisible = _b[1];
  (0, react_1.useEffect)(
    function () {
      if (notification) {
        setIsVisible(true);
        // Auto-hide after 5 seconds
        var timer_1 = setTimeout(function () {
          setIsVisible(false);
          onClose();
        }, 5000);
        return function () {
          return clearTimeout(timer_1);
        };
      }
    },
    [notification, onClose],
  );
  if (!notification || !isVisible) return null;
  return (
    <div className="fixed bottom-5 right-5 bg-[#1A1A1A]/90 backdrop-blur-sm rounded-lg p-4 border border-[#FF0066]/30 shadow-lg shadow-[#FF0066]/20 max-w-xs animate-float z-50">
      <div className="flex">
        <div className="h-10 w-10 flex items-center justify-center bg-[#FF0066]/20 rounded-full mr-3">
          <i className="ri-notification-3-line text-[#FF0066]"></i>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">{notification.title}</h4>
          <p className="text-xs text-gray-400">{notification.message}</p>
        </div>
      </div>
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={onClose}
      >
        <i className="ri-close-line"></i>
      </button>
    </div>
  );
}
