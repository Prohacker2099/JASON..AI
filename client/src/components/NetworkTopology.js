"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var NetworkTopology = function (_a) {
  var devices = _a.devices,
    onDeviceSelect = _a.onDeviceSelect,
    _b = _a.className,
    className = _b === void 0 ? "" : _b;
  var containerRef = (0, react_1.useRef)(null);
  var graphRef = (0, react_1.useRef)(null);
  // Prepare graph data
  var getGraphData = function () {
    // Find router or main device
    var router =
      devices.find(function (d) {
        return (
          d.type === "router" || d.type === "gateway" || d.type === "bridge"
        );
      }) || devices[0];
    // Create nodes
    var nodes = devices.map(function (device) {
      return {
        id: device.id,
        name: device.name,
        type: device.type,
        val: getNodeSize(device),
        color: getNodeColor(device),
        device: device,
      };
    });
    // Create links (connections between devices)
    var links = [];
    // Connect all devices to router or to each other
    devices.forEach(function (device) {
      if (
        device.id !==
        (router === null || router === void 0 ? void 0 : router.id)
      ) {
        links.push({
          source:
            (router === null || router === void 0 ? void 0 : router.id) || "",
          target: device.id,
          value: 1,
          type: "connection",
        });
      }
    });
    // Add some direct device-to-device connections for visualization
    var addedLinks = new Set();
    devices.forEach(function (source) {
      devices.forEach(function (target) {
        if (
          source.id !== target.id &&
          source.id !==
            (router === null || router === void 0 ? void 0 : router.id) &&
          target.id !==
            (router === null || router === void 0 ? void 0 : router.id) &&
          Math.random() > 0.7 // Only add some connections
        ) {
          var linkId = "".concat(source.id, "-").concat(target.id);
          var reverseLinkId = "".concat(target.id, "-").concat(source.id);
          if (!addedLinks.has(linkId) && !addedLinks.has(reverseLinkId)) {
            links.push({
              source: source.id,
              target: target.id,
              value: 0.5,
              type: "peer",
            });
            addedLinks.add(linkId);
          }
        }
      });
    });
    return { nodes: nodes, links: links };
  };
  // Get node size based on device type
  var getNodeSize = function (device) {
    switch (device.type) {
      case "router":
      case "gateway":
      case "bridge":
        return 5;
      case "camera":
      case "thermostat":
        return 3;
      default:
        return 2;
    }
  };
  // Get node color based on device type and status
  var getNodeColor = function (device) {
    if (!device.online) {
      return "rgba(239, 68, 68, 0.8)"; // Red for offline
    }
    switch (device.type) {
      case "router":
      case "gateway":
      case "bridge":
        return "rgba(59, 130, 246, 0.8)"; // Blue
      case "light":
        return "rgba(250, 204, 21, 0.8)"; // Yellow
      case "switch":
      case "outlet":
        return "rgba(16, 185, 129, 0.8)"; // Green
      case "camera":
        return "rgba(139, 92, 246, 0.8)"; // Purple
      case "thermostat":
        return "rgba(249, 115, 22, 0.8)"; // Orange
      case "speaker":
        return "rgba(14, 165, 233, 0.8)"; // Sky blue
      default:
        return "rgba(209, 213, 219, 0.8)"; // Gray
    }
  };
  // Initialize and update the 3D force graph
  (0, react_1.useEffect)(
    function () {
      if (!containerRef.current) return;
      // Check if d3 and ForceGraph3D are available
      if (!window.d3 || !window.ForceGraph3D) {
        console.error("Required libraries not loaded: d3 or ForceGraph3D");
        return;
      }
      var _a = getGraphData(),
        nodes = _a.nodes,
        links = _a.links;
      // Initialize the graph if it doesn't exist
      if (!graphRef.current) {
        graphRef.current = window
          .ForceGraph3D({ controlType: "orbit" })
          .backgroundColor("rgba(0,0,0,0)")
          .nodeLabel(function (node) {
            return "".concat(node.name, " (").concat(node.type, ")");
          })
          .nodeColor(function (node) {
            return node.color;
          })
          .nodeVal(function (node) {
            return node.val;
          })
          .linkWidth(function (link) {
            return link.value;
          })
          .linkColor(function (link) {
            return link.type === "connection"
              ? "rgba(59, 130, 246, 0.5)"
              : "rgba(139, 92, 246, 0.3)";
          })
          .linkDirectionalParticles(3)
          .linkDirectionalParticleWidth(function (link) {
            return link.value;
          })
          .linkDirectionalParticleSpeed(0.005)
          .onNodeClick(function (node) {
            // Handle node click
            onDeviceSelect(node.device);
          });
        graphRef.current(containerRef.current);
      }
      // Update graph data
      graphRef.current
        .graphData({ nodes: nodes, links: links })
        .d3Force("charge", window.d3.forceManyBody().strength(-100))
        .d3Force(
          "link",
          window.d3
            .forceLink(links)
            .id(function (d) {
              return d.id;
            })
            .distance(50),
        )
        .d3Force("center", window.d3.forceCenter());
      // Cleanup
      return function () {
        if (graphRef.current && containerRef.current) {
          // Clean up the graph
          containerRef.current.innerHTML = "";
          graphRef.current = null;
        }
      };
    },
    [devices, onDeviceSelect],
  );
  return (
    <div className={"relative ".concat(className)}>
      <framer_motion_1.motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-4 left-4 z-10 glass p-3 rounded-lg"
      >
        <h2 className="text-lg font-medium text-white">Network Topology</h2>
        <p className="text-sm text-blue-300">
          {devices.length} Connected Devices
        </p>
      </framer_motion_1.motion.div>

      <div ref={containerRef} className="w-full h-full min-h-[500px]" />

      <div className="absolute bottom-4 right-4 z-10 glass p-3 rounded-lg">
        <div className="text-sm text-white mb-2">Device Types</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span className="text-xs text-gray-300">Router/Bridge</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
            <span className="text-xs text-gray-300">Lights</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-xs text-gray-300">Switches/Outlets</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            <span className="text-xs text-gray-300">Cameras</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
            <span className="text-xs text-gray-300">Thermostats</span>
          </div>
        </div>
      </div>
    </div>
  );
};
exports.default = NetworkTopology;
