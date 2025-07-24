"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var AdaptiveCard = function (_a) {
  var title = _a.title,
    icon = _a.icon,
    children = _a.children,
    _b = _a.priority,
    priority = _b === void 0 ? "medium" : _b,
    contextInfo = _a.contextInfo,
    onDismiss = _a.onDismiss,
    onExpand = _a.onExpand,
    _c = _a.className,
    className = _c === void 0 ? "" : _c,
    _d = _a.expandable,
    expandable = _d === void 0 ? true : _d,
    _e = _a.dismissible,
    dismissible = _e === void 0 ? true : _e,
    _f = _a.initialState,
    initialState = _f === void 0 ? "collapsed" : _f,
    _g = _a.adaptiveHeight,
    adaptiveHeight = _g === void 0 ? true : _g,
    _h = _a.adaptiveContent,
    adaptiveContent = _h === void 0 ? true : _h,
    _j = _a.adaptivePosition,
    adaptivePosition = _j === void 0 ? false : _j,
    _k = _a.interactionCount,
    interactionCount = _k === void 0 ? 0 : _k,
    lastInteraction = _a.lastInteraction;
  var _l = (0, react_1.useState)(initialState === "expanded"),
    expanded = _l[0],
    setExpanded = _l[1];
  var _m = (0, react_1.useState)(false),
    dismissed = _m[0],
    setDismissed = _m[1];
  var _o = (0, react_1.useState)(0),
    contentHeight = _o[0],
    setContentHeight = _o[1];
  var _p = (0, react_1.useState)(null),
    contentRef = _p[0],
    setContentRef = _p[1];
  var _q = (0, react_1.useState)(false),
    isHovered = _q[0],
    setIsHovered = _q[1];
  // Priority-based styling
  var priorityStyles = {
    low: "border-blue-400/30",
    medium: "border-purple-500/40",
    high: "border-amber-500/50",
    critical: "border-red-500/60 animate-pulse-slow",
  };
  // Update height when content changes or on expand/collapse
  (0, react_1.useEffect)(
    function () {
      if (contentRef && adaptiveHeight) {
        setContentHeight(expanded ? contentRef.scrollHeight : 0);
      }
    },
    [expanded, contentRef, children, adaptiveHeight],
  );
  // Handle dismiss
  var handleDismiss = function () {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };
  // Handle expand
  var handleExpand = function () {
    setExpanded(!expanded);
    if (onExpand && !expanded) onExpand();
  };
  if (dismissed) return null;
  return (
    <framer_motion_1.AnimatePresence>
      <framer_motion_1.motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={"adaptive-card glass relative overflow-hidden rounded-xl border "
          .concat(priorityStyles[priority], " ")
          .concat(className)}
        onMouseEnter={function () {
          return setIsHovered(true);
        }}
        onMouseLeave={function () {
          return setIsHovered(false);
        }}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-blue-400">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>

          <div className="flex space-x-2">
            {expandable && (
              <button
                onClick={handleExpand}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={"h-5 w-5 transition-transform ".concat(
                    expanded ? "rotate-180" : "",
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contextual Information */}
        {contextInfo && (
          <div className="px-4 pb-2 text-sm text-blue-300">
            <p>{contextInfo}</p>
          </div>
        )}

        {/* Card Content */}
        <framer_motion_1.motion.div
          animate={{ height: expanded || !adaptiveHeight ? "auto" : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div ref={setContentRef} className="p-4 pt-0">
            {children}
          </div>
        </framer_motion_1.motion.div>

        {/* Interactive Glow Effect */}
        <framer_motion_1.motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5"
          animate={{
            opacity: isHovered ? 0.3 : 0,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Priority Indicator */}
        <div
          className={"absolute top-0 right-0 h-2 w-2 rounded-full m-2 ".concat(
            priority === "low"
              ? "bg-blue-400"
              : priority === "medium"
                ? "bg-purple-500"
                : priority === "high"
                  ? "bg-amber-500"
                  : "bg-red-500",
          )}
        />
      </framer_motion_1.motion.div>
    </framer_motion_1.AnimatePresence>
  );
};
exports.default = AdaptiveCard;
