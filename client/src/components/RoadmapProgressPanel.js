"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var card_1 = require("./ui/card");
var progress_1 = require("./ui/progress");
var badge_1 = require("./ui/badge");
var tabs_1 = require("./ui/tabs");
var roadmapService_1 = require("../lib/roadmapService");
var RoadmapProgressPanel = function () {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
  var _p = (0, react_1.useState)("device-integration"),
    activeTab = _p[0],
    setActiveTab = _p[1];
  var _q = (0, react_1.useState)(true),
    loading = _q[0],
    setLoading = _q[1];
  var _r = (0, react_1.useState)(null),
    error = _r[0],
    setError = _r[1];
  // State for each roadmap area
  var _s = (0, react_1.useState)(null),
    deviceIntegration = _s[0],
    setDeviceIntegration = _s[1];
  var _t = (0, react_1.useState)(null),
    aiLearning = _t[0],
    setAILearning = _t[1];
  var _u = (0, react_1.useState)(null),
    dataDividend = _u[0],
    setDataDividend = _u[1];
  var _v = (0, react_1.useState)(null),
    marketplace = _v[0],
    setMarketplace = _v[1];
  var _w = (0, react_1.useState)(null),
    hardware = _w[0],
    setHardware = _w[1];
  (0, react_1.useEffect)(function () {
    var fetchData = function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var _a,
          deviceIntegrationData,
          aiLearningData,
          dataClassifications,
          featuredExtensions,
          hardwareDevices,
          err_1;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              setLoading(true);
              setError(null);
              _b.label = 1;
            case 1:
              _b.trys.push([1, 3, 4, 5]);
              return [
                4 /*yield*/,
                Promise.all([
                  roadmapService_1.default.getDeviceIntegrationStatus(),
                  roadmapService_1.default.getAILearningStatus(),
                  roadmapService_1.default.getDataClassifications(),
                  roadmapService_1.default.getFeaturedExtensions(5),
                  roadmapService_1.default.getHardwareDevices(),
                ]),
              ];
            case 2:
              ((_a = _b.sent()),
                (deviceIntegrationData = _a[0]),
                (aiLearningData = _a[1]),
                (dataClassifications = _a[2]),
                (featuredExtensions = _a[3]),
                (hardwareDevices = _a[4]));
              setDeviceIntegration(deviceIntegrationData);
              setAILearning(aiLearningData);
              setDataDividend({ classifications: dataClassifications });
              setMarketplace({ extensions: featuredExtensions });
              setHardware({ devices: hardwareDevices });
              return [3 /*break*/, 5];
            case 3:
              err_1 = _b.sent();
              console.error("Error fetching roadmap data:", err_1);
              setError(
                "Failed to load roadmap implementation data. Please try again later.",
              );
              return [3 /*break*/, 5];
            case 4:
              setLoading(false);
              return [7 /*endfinally*/];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    };
    fetchData();
  }, []);
  // Calculate progress percentages (these would come from real data in a full implementation)
  var progressData = {
    deviceIntegration: 65,
    aiLearning: 70,
    dataDividend: 50,
    marketplace: 40,
    hardware: 30,
  };
  if (loading) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Roadmap Implementation Progress</card_1.CardTitle>
          <card_1.CardDescription>
            Loading implementation status...
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  if (error) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Roadmap Implementation Progress</card_1.CardTitle>
          <card_1.CardDescription>
            Error loading implementation status
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="text-red-400">{error}</div>
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  return (
    <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
      <card_1.CardHeader>
        <card_1.CardTitle>Roadmap Implementation Progress</card_1.CardTitle>
        <card_1.CardDescription>
          Current status of the JASON implementation roadmap
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {Object.entries({
            "Device Integration": progressData.deviceIntegration,
            "AI Learning Engine": progressData.aiLearning,
            "Data Dividend": progressData.dataDividend,
            "Developer Marketplace": progressData.marketplace,
            "Hardware Hub": progressData.hardware,
          }).map(function (_a) {
            var area = _a[0],
              progress = _a[1];
            return (
              <card_1.Card
                key={area}
                className="bg-gray-800/50 border-gray-700"
              >
                <card_1.CardHeader className="pb-2">
                  <card_1.CardTitle className="text-sm font-medium">
                    {area}
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-2">
                    <progress_1.Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-400">
                      {progress}% Complete
                    </p>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            );
          })}
        </div>

        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid grid-cols-5 mb-6">
            <tabs_1.TabsTrigger value="device-integration">
              Device Integration
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="ai-learning">
              AI Learning
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="data-dividend">
              Data Dividend
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="marketplace">
              Marketplace
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="hardware">
              Hardware Hub
            </tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="device-integration" className="space-y-4">
            <h3 className="text-lg font-semibold">
              Device Integration Expansion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Supported Protocols
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="flex flex-wrap gap-2">
                    {((_a =
                      deviceIntegration === null || deviceIntegration === void 0
                        ? void 0
                        : deviceIntegration.supportedProtocols) === null ||
                    _a === void 0
                      ? void 0
                      : _a.map(function (protocol) {
                          return (
                            <badge_1.Badge key={protocol} variant="outline">
                              {protocol}
                            </badge_1.Badge>
                          );
                        })) || (
                      <p className="text-gray-400">No protocols available</p>
                    )}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Device Types
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="flex flex-wrap gap-2">
                    {((_b =
                      deviceIntegration === null || deviceIntegration === void 0
                        ? void 0
                        : deviceIntegration.supportedDeviceTypes) === null ||
                    _b === void 0
                      ? void 0
                      : _b.map(function (type) {
                          return (
                            <badge_1.Badge key={type} variant="outline">
                              {type}
                            </badge_1.Badge>
                          );
                        })) || (
                      <p className="text-gray-400">No device types available</p>
                    )}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                Implementation Progress
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <badge_1.Badge className="bg-green-500 mr-2">
                    Completed
                  </badge_1.Badge>
                  <span>Basic protocol support for major ecosystems</span>
                </li>
                <li className="flex items-center">
                  <badge_1.Badge className="bg-amber-500 mr-2">
                    In Progress
                  </badge_1.Badge>
                  <span>Enhanced Matter/Thread controller capabilities</span>
                </li>
                <li className="flex items-center">
                  <badge_1.Badge className="bg-amber-500 mr-2">
                    In Progress
                  </badge_1.Badge>
                  <span>Advanced device type handlers</span>
                </li>
                <li className="flex items-center">
                  <badge_1.Badge className="bg-slate-500 mr-2">
                    Planned
                  </badge_1.Badge>
                  <span>HomeKit bridge functionality</span>
                </li>
              </ul>
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="ai-learning" className="space-y-4">
            <h3 className="text-lg font-semibold">
              AI Learning Engine Enhancement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Model Information
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Version:</span>
                      <span>
                        {((_c =
                          aiLearning === null || aiLearning === void 0
                            ? void 0
                            : aiLearning.modelInfo) === null || _c === void 0
                          ? void 0
                          : _c.version) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data Points:</span>
                      <span>
                        {((_e =
                          (_d =
                            aiLearning === null || aiLearning === void 0
                              ? void 0
                              : aiLearning.modelInfo) === null || _d === void 0
                            ? void 0
                            : _d.dataPoints) === null || _e === void 0
                          ? void 0
                          : _e.toLocaleString()) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Trained:</span>
                      <span>
                        {(
                          (_f =
                            aiLearning === null || aiLearning === void 0
                              ? void 0
                              : aiLearning.modelInfo) === null || _f === void 0
                            ? void 0
                            : _f.lastTrained
                        )
                          ? new Date(
                              aiLearning.modelInfo.lastTrained,
                            ).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Recognized Patterns
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  {((_g =
                    aiLearning === null || aiLearning === void 0
                      ? void 0
                      : aiLearning.patterns) === null || _g === void 0
                    ? void 0
                    : _g.length) > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {aiLearning.patterns
                        .slice(0, 3)
                        .map(function (pattern, index) {
                          return (
                            <li
                              key={index}
                              className="border-b border-gray-700 pb-2"
                            >
                              <div className="flex justify-between">
                                <span>{pattern.description}</span>
                                <badge_1.Badge variant="outline">
                                  {Math.round(pattern.confidence * 100)}%
                                </badge_1.Badge>
                              </div>
                            </li>
                          );
                        })}
                      {aiLearning.patterns.length > 3 && (
                        <li className="text-center text-blue-400 text-xs">
                          +{aiLearning.patterns.length - 3} more patterns
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No patterns recognized yet</p>
                  )}
                </card_1.CardContent>
              </card_1.Card>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                Implementation Progress
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <badge_1.Badge className="bg-green-500 mr-2">
                    Completed
                  </badge_1.Badge>
                  <span>Basic temporal pattern recognition</span>
                </li>
                <li className="flex items-center">
                  <badge_1.Badge className="bg-green-500 mr-2">
                    Completed
                  </badge_1.Badge>
                  <span>Initial behavioral clustering algorithms</span>
                </li>
                <li className="flex items-center">
                  <badge_1.Badge className="bg-amber-500 mr-2">
                    In Progress
                  </badge_1.Badge>
                  <span>Multi-modal context fusion</span>
                </li>
                <li className="flex items-center">
                  <badge_1.Badge className="bg-slate-500 mr-2">
                    Planned
                  </badge_1.Badge>
                  <span>Multi-user preference learning</span>
                </li>
              </ul>
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="data-dividend" className="space-y-4">
            <h3 className="text-lg font-semibold">Data Dividend Framework</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Data Classifications
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  {((_j =
                    (_h =
                      dataDividend === null || dataDividend === void 0
                        ? void 0
                        : dataDividend.classifications) === null ||
                    _h === void 0
                      ? void 0
                      : _h.classifications) === null || _j === void 0
                    ? void 0
                    : _j.length) > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {dataDividend.classifications.classifications
                        .slice(0, 4)
                        .map(function (classification, index) {
                          return (
                            <li
                              key={index}
                              className="border-b border-gray-700 pb-2"
                            >
                              <div className="flex justify-between">
                                <span>{classification.category}</span>
                                <badge_1.Badge
                                  className={
                                    classification.privacyImpact === "low"
                                      ? "bg-green-500"
                                      : classification.privacyImpact ===
                                          "medium"
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }
                                >
                                  {classification.privacyImpact}
                                </badge_1.Badge>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {classification.description}
                              </div>
                            </li>
                          );
                        })}
                      {dataDividend.classifications.classifications.length >
                        4 && (
                        <li className="text-center text-blue-400 text-xs">
                          +
                          {dataDividend.classifications.classifications.length -
                            4}{" "}
                          more classifications
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400">
                      No data classifications available
                    </p>
                  )}
                </card_1.CardContent>
              </card_1.Card>
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Implementation Status
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center">
                      <span>Data Classification System</span>
                      <badge_1.Badge className="bg-green-500">
                        Completed
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Privacy-Preserving Pipeline</span>
                      <badge_1.Badge className="bg-amber-500">
                        In Progress
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Consent Management UI</span>
                      <badge_1.Badge className="bg-amber-500">
                        In Progress
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Compensation Mechanisms</span>
                      <badge_1.Badge className="bg-slate-500">
                        Planned
                      </badge_1.Badge>
                    </li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="marketplace" className="space-y-4">
            <h3 className="text-lg font-semibold">Developer Marketplace</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Featured Extensions
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  {((_l =
                    (_k =
                      marketplace === null || marketplace === void 0
                        ? void 0
                        : marketplace.extensions) === null || _k === void 0
                      ? void 0
                      : _k.extensions) === null || _l === void 0
                    ? void 0
                    : _l.length) > 0 ? (
                    <ul className="space-y-3 text-sm">
                      {marketplace.extensions.extensions.map(
                        function (extension, index) {
                          return (
                            <li
                              key={index}
                              className="border-b border-gray-700 pb-2"
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  {extension.name}
                                </span>
                                <badge_1.Badge variant="outline">
                                  {extension.pricing.model}
                                </badge_1.Badge>
                              </div>
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {extension.description}
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-xs">
                                  {extension.developerName}
                                </span>
                                <div className="flex items-center">
                                  <span className="text-yellow-400 mr-1">
                                    ★
                                  </span>
                                  <span className="text-xs">
                                    {extension.rating.average.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No extensions available</p>
                  )}
                </card_1.CardContent>
              </card_1.Card>
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Implementation Status
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center">
                      <span>Extension Architecture</span>
                      <badge_1.Badge className="bg-green-500">
                        Completed
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Core SDK</span>
                      <badge_1.Badge className="bg-amber-500">
                        In Progress
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Developer Portal</span>
                      <badge_1.Badge className="bg-amber-500">
                        In Progress
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Monetization System</span>
                      <badge_1.Badge className="bg-slate-500">
                        Planned
                      </badge_1.Badge>
                    </li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="hardware" className="space-y-4">
            <h3 className="text-lg font-semibold">Hardware Hub</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Hardware Devices
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  {((_o =
                    (_m =
                      hardware === null || hardware === void 0
                        ? void 0
                        : hardware.devices) === null || _m === void 0
                      ? void 0
                      : _m.devices) === null || _o === void 0
                    ? void 0
                    : _o.length) > 0 ? (
                    <ul className="space-y-3 text-sm">
                      {hardware.devices.devices.map(function (device, index) {
                        return (
                          <li
                            key={index}
                            className="border-b border-gray-700 pb-2"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {device.model}
                              </span>
                              <badge_1.Badge
                                className={
                                  device.status === "online"
                                    ? "bg-green-500"
                                    : device.status === "updating"
                                      ? "bg-blue-500"
                                      : "bg-red-500"
                                }
                              >
                                {device.status}
                              </badge_1.Badge>
                            </div>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                S/N: {device.serialNumber}
                              </span>
                              <span className="text-xs text-gray-400">
                                FW: {device.firmwareVersion}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-gray-400">
                      No hardware devices available
                    </p>
                  )}
                </card_1.CardContent>
              </card_1.Card>
              <card_1.Card className="bg-gray-800/50 border-gray-700">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-sm">
                    Implementation Status
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center">
                      <span>Hardware Specifications</span>
                      <badge_1.Badge className="bg-green-500">
                        Completed
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Prototype Development</span>
                      <badge_1.Badge className="bg-amber-500">
                        In Progress
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Manufacturing Partnerships</span>
                      <badge_1.Badge className="bg-amber-500">
                        In Progress
                      </badge_1.Badge>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Production Firmware</span>
                      <badge_1.Badge className="bg-slate-500">
                        Planned
                      </badge_1.Badge>
                    </li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>
            </div>
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
    </card_1.Card>
  );
};
exports.default = RoadmapProgressPanel;
