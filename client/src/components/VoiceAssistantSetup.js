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
var tabs_1 = require("./ui/tabs");
var switch_1 = require("./ui/switch");
var button_1 = require("./ui/button");
var alert_1 = require("./ui/alert");
var lucide_react_1 = require("lucide-react");
var qrcode_react_1 = require("qrcode.react");
var GoogleAssistantSetup_1 = require("./GoogleAssistantSetup");
var VoiceAssistantSetup = function () {
  var _a = (0, react_1.useState)("hue"),
    activeTab = _a[0],
    setActiveTab = _a[1];
  var _b = (0, react_1.useState)(null),
    status = _b[0],
    setStatus = _b[1];
  var _c = (0, react_1.useState)(true),
    loading = _c[0],
    setLoading = _c[1];
  var _d = (0, react_1.useState)(null),
    error = _d[0],
    setError = _d[1];
  var _e = (0, react_1.useState)(null),
    success = _e[0],
    setSuccess = _e[1];
  var _f = (0, react_1.useState)(30),
    tokenDays = _f[0],
    setTokenDays = _f[1];
  var _g = (0, react_1.useState)(false),
    copied = _g[0],
    setCopied = _g[1];
  // Fetch status on component mount
  (0, react_1.useEffect)(function () {
    fetchStatus();
  }, []);
  // Fetch voice assistant integration status
  var fetchStatus = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            return [4 /*yield*/, fetch("/api/voice-assistant/status")];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch voice assistant status");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setStatus(data);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            setError("Failed to load voice assistant integration status");
            console.error(err_1);
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
  // Toggle Hue emulation
  var toggleHueEmulation = function (enabled) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            setSuccess(null);
            return [
              4 /*yield*/,
              fetch("/api/voice-assistant/hue-emulation", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ enabled: enabled }),
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to update Hue emulation settings");
            }
            return [4 /*yield*/, fetchStatus()];
          case 2:
            _a.sent();
            setSuccess(
              "Hue emulation ".concat(
                enabled ? "enabled" : "disabled",
                " successfully",
              ),
            );
            return [3 /*break*/, 5];
          case 3:
            err_2 = _a.sent();
            setError("Failed to update Hue emulation settings");
            console.error(err_2);
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
  // Toggle Matter bridge
  var toggleMatterBridge = function (enabled) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, err_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            setSuccess(null);
            return [
              4 /*yield*/,
              fetch("/api/voice-assistant/matter-bridge", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ enabled: enabled }),
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to update Matter bridge settings");
            }
            return [4 /*yield*/, fetchStatus()];
          case 2:
            _a.sent();
            setSuccess(
              "Matter bridge ".concat(
                enabled ? "enabled" : "disabled",
                " successfully",
              ),
            );
            return [3 /*break*/, 5];
          case 3:
            err_3 = _a.sent();
            setError("Failed to update Matter bridge settings");
            console.error(err_3);
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
  // Toggle Google Assistant bridge
  var toggleGoogleAssistant = function (enabled) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, err_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            setSuccess(null);
            return [
              4 /*yield*/,
              fetch("/api/voice-assistant/google-assistant", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ enabled: enabled }),
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to update Google Assistant settings");
            }
            return [4 /*yield*/, fetchStatus()];
          case 2:
            _a.sent();
            setSuccess(
              "Google Assistant integration ".concat(
                enabled ? "enabled" : "disabled",
                " successfully",
              ),
            );
            return [3 /*break*/, 5];
          case 3:
            err_4 = _a.sent();
            setError("Failed to update Google Assistant settings");
            console.error(err_4);
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
  // Generate token
  var generateToken = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, err_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            setSuccess(null);
            return [
              4 /*yield*/,
              fetch("/api/voice-assistant/token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ expiryDays: tokenDays }),
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to generate token");
            }
            return [4 /*yield*/, fetchStatus()];
          case 2:
            _a.sent();
            setSuccess("Token generated successfully");
            return [3 /*break*/, 5];
          case 3:
            err_5 = _a.sent();
            setError("Failed to generate token");
            console.error(err_5);
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
  // Revoke token
  var revokeToken = function (token) {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, err_6;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            setSuccess(null);
            return [
              4 /*yield*/,
              fetch("/api/voice-assistant/token/".concat(token), {
                method: "DELETE",
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to revoke token");
            }
            return [4 /*yield*/, fetchStatus()];
          case 2:
            _a.sent();
            setSuccess("Token revoked successfully");
            return [3 /*break*/, 5];
          case 3:
            err_6 = _a.sent();
            setError("Failed to revoke token");
            console.error(err_6);
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
  // Copy token to clipboard
  var copyToClipboard = function (text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(function () {
      return setCopied(false);
    }, 2000);
  };
  // Format expiry date
  var formatExpiry = function (dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };
  if (loading && !status) {
    return (
      <card_1.Card className="w-full">
        <card_1.CardHeader>
          <card_1.CardTitle>Voice Assistant Integration</card_1.CardTitle>
          <card_1.CardDescription>Loading...</card_1.CardDescription>
        </card_1.CardHeader>
      </card_1.Card>
    );
  }
  return (
    <card_1.Card className="w-full">
      <card_1.CardHeader>
        <card_1.CardTitle>Voice Assistant Integration</card_1.CardTitle>
        <card_1.CardDescription>
          Configure how JASON integrates with voice assistants like Alexa and
          Google Assistant without requiring login credentials.
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        {error && (
          <alert_1.Alert variant="destructive" className="mb-4">
            <lucide_react_1.AlertTriangle className="h-4 w-4" />
            <alert_1.AlertTitle>Error</alert_1.AlertTitle>
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>
        )}

        {success && (
          <alert_1.Alert
            variant="default"
            className="mb-4 bg-green-50 border-green-200"
          >
            <lucide_react_1.CheckCircle className="h-4 w-4 text-green-500" />
            <alert_1.AlertTitle className="text-green-700">
              Success
            </alert_1.AlertTitle>
            <alert_1.AlertDescription className="text-green-600">
              {success}
            </alert_1.AlertDescription>
          </alert_1.Alert>
        )}

        <tabs_1.Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <tabs_1.TabsList className="grid grid-cols-4 mb-4">
            <tabs_1.TabsTrigger value="hue">Hue Emulation</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="google">
              Google Assistant
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="matter">
              Matter Bridge
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="token">Token-Based</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="hue" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  Philips Hue Bridge Emulation
                </h3>
                <p className="text-sm text-gray-500">
                  Emulate a Philips Hue Bridge on your local network for direct
                  discovery by voice assistants.
                </p>
              </div>
              <switch_1.Switch
                checked={
                  (status === null || status === void 0
                    ? void 0
                    : status.hueEmulation.enabled) || false
                }
                onCheckedChange={toggleHueEmulation}
                disabled={loading}
              />
            </div>

            {(status === null || status === void 0
              ? void 0
              : status.hueEmulation.enabled) && (
              <alert_1.Alert>
                <lucide_react_1.InfoIcon className="h-4 w-4" />
                <alert_1.AlertTitle>How to connect</alert_1.AlertTitle>
                <alert_1.AlertDescription>
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Open your Alexa or Google Home app</li>
                    <li>Select "Add Device" or "Set up device"</li>
                    <li>Choose "Philips Hue" as the device type</li>
                    <li>
                      Follow the instructions to discover the JASON Hue Bridge
                    </li>
                    <li>
                      Your JASON-controlled devices will appear as Hue devices
                    </li>
                  </ol>
                </alert_1.AlertDescription>
              </alert_1.Alert>
            )}
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="google" className="space-y-4">
            <GoogleAssistantSetup_1.default
              enabled={
                (status === null || status === void 0
                  ? void 0
                  : status.googleAssistant.enabled) || false
              }
              onToggle={toggleGoogleAssistant}
              isLoading={loading}
            />
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="matter" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Matter Protocol Bridge</h3>
                <p className="text-sm text-gray-500">
                  Use the open Matter protocol for local control without cloud
                  dependencies.
                </p>
              </div>
              <switch_1.Switch
                checked={
                  (status === null || status === void 0
                    ? void 0
                    : status.matterBridge.enabled) || false
                }
                onCheckedChange={toggleMatterBridge}
                disabled={loading}
              />
            </div>

            {(status === null || status === void 0
              ? void 0
              : status.matterBridge.enabled) &&
              (status === null || status === void 0
                ? void 0
                : status.matterBridge.pairingCode) && (
                <div className="space-y-4">
                  <alert_1.Alert>
                    <lucide_react_1.InfoIcon className="h-4 w-4" />
                    <alert_1.AlertTitle>Pairing Information</alert_1.AlertTitle>
                    <alert_1.AlertDescription>
                      <div className="mt-2">
                        <p className="font-medium">Pairing Code:</p>
                        <div className="flex items-center mt-1">
                          <code className="bg-gray-100 p-2 rounded text-lg tracking-wider">
                            {status.matterBridge.pairingCode}
                          </code>
                          <button_1.Button
                            variant="ghost"
                            size="sm"
                            onClick={function () {
                              return copyToClipboard(
                                status.matterBridge.pairingCode || "",
                              );
                            }}
                            className="ml-2"
                          >
                            <lucide_react_1.Copy className="h-4 w-4" />
                          </button_1.Button>
                        </div>
                      </div>

                      {status.matterBridge.qrCode && (
                        <div className="mt-4">
                          <p className="font-medium">QR Code:</p>
                          <div className="bg-white p-4 rounded-lg inline-block mt-1">
                            <qrcode_react_1.default
                              value={status.matterBridge.qrCode}
                              size={150}
                            />
                          </div>
                        </div>
                      )}

                      <ol className="list-decimal ml-4 mt-4 space-y-1">
                        <li>
                          Open your Matter-compatible app (Alexa, Google Home,
                          Apple Home)
                        </li>
                        <li>Select "Add Device" or "Set up device"</li>
                        <li>Choose "Matter" as the device type</li>
                        <li>
                          Scan the QR code or enter the pairing code manually
                        </li>
                        <li>Follow the instructions to complete setup</li>
                      </ol>
                    </alert_1.AlertDescription>
                  </alert_1.Alert>
                </div>
              )}
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="token" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Token-Based Integration</h3>
                <p className="text-sm text-gray-500">
                  Generate a secure token for voice assistant skills/actions
                  without sharing credentials.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button_1.Button
                  onClick={generateToken}
                  disabled={loading}
                  variant="outline"
                >
                  Generate Token
                </button_1.Button>
              </div>
            </div>

            {(
              status === null || status === void 0
                ? void 0
                : status.tokenBased.token
            ) ? (
              <alert_1.Alert>
                <lucide_react_1.InfoIcon className="h-4 w-4" />
                <alert_1.AlertTitle>Your Integration Token</alert_1.AlertTitle>
                <alert_1.AlertDescription>
                  <div className="mt-2">
                    <p className="font-medium">Token:</p>
                    <div className="flex items-center mt-1">
                      <code className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-w-full">
                        {status.tokenBased.token}
                      </code>
                      <button_1.Button
                        variant="ghost"
                        size="sm"
                        onClick={function () {
                          return copyToClipboard(status.tokenBased.token || "");
                        }}
                        className="ml-2"
                      >
                        {copied ? (
                          <lucide_react_1.CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <lucide_react_1.Copy className="h-4 w-4" />
                        )}
                      </button_1.Button>
                    </div>

                    {status.tokenBased.expiry && (
                      <p className="text-sm mt-2">
                        Expires: {formatExpiry(status.tokenBased.expiry)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="font-medium">How to use:</p>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>
                        Install the JASON skill/action from the Alexa/Google
                        Assistant store
                      </li>
                      <li>Open the skill/action and select "Link Account"</li>
                      <li>Enter this token when prompted</li>
                      <li>
                        Your voice assistant will now be able to control your
                        JASON devices
                      </li>
                    </ol>
                  </div>

                  <div className="mt-4">
                    <button_1.Button
                      variant="destructive"
                      size="sm"
                      onClick={function () {
                        return (
                          status.tokenBased.token &&
                          revokeToken(status.tokenBased.token)
                        );
                      }}
                      disabled={loading}
                    >
                      Revoke Token
                    </button_1.Button>
                  </div>
                </alert_1.AlertDescription>
              </alert_1.Alert>
            ) : (
              <div className="p-4 border rounded-md">
                <p className="text-sm">
                  Generate a token to enable secure integration with voice
                  assistant skills and actions. This allows voice assistants to
                  control your JASON devices without requiring you to share your
                  credentials.
                </p>
              </div>
            )}
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
      <card_1.CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          All integration methods prioritize local control and privacy.
        </p>
        <button_1.Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
        >
          <lucide_react_1.RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = VoiceAssistantSetup;
