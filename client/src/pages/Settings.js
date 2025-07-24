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
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Settings;
var react_1 = require("react");
var HeaderComponent_1 = require("@/components/HeaderComponent");
var FooterComponent_1 = require("@/components/FooterComponent");
var NotificationPanel_1 = require("@/components/NotificationPanel");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var tabs_1 = require("@/components/ui/tabs");
var card_1 = require("@/components/ui/card");
var label_1 = require("@/components/ui/label");
var switch_1 = require("@/components/ui/switch");
var queryClient_1 = require("@/lib/queryClient");
var lucide_react_1 = require("lucide-react");
function Settings() {
  var _this = this;
  var _a = (0, react_1.useState)(null),
    notification = _a[0],
    setNotification = _a[1];
  var _b = (0, react_1.useState)(false),
    isLoading = _b[0],
    setIsLoading = _b[1];
  var _c = (0, react_1.useState)(null),
    error = _c[0],
    setError = _c[1];
  // Integration settings
  var _d = (0, react_1.useState)(""),
    amazonEmail = _d[0],
    setAmazonEmail = _d[1];
  var _e = (0, react_1.useState)(""),
    amazonPassword = _e[0],
    setAmazonPassword = _e[1];
  var _f = (0, react_1.useState)(""),
    homeAssistantUrl = _f[0],
    setHomeAssistantUrl = _f[1];
  var _g = (0, react_1.useState)(false),
    amazonConfigured = _g[0],
    setAmazonConfigured = _g[1];
  var _h = (0, react_1.useState)([]),
    deviceCredentials = _h[0],
    setDeviceCredentials = _h[1];
  var _j = (0, react_1.useState)(true),
    loadingSettings = _j[0],
    setLoadingSettings = _j[1];
  // Load existing integration settings
  (0, react_1.useEffect)(function () {
    var fetchSettings = function () {
      return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 4, 5, 6]);
              setLoadingSettings(true);
              return [
                4 /*yield*/,
                (0, queryClient_1.apiRequest)(
                  "GET",
                  "/api/settings/integrations",
                ),
              ];
            case 1:
              response = _a.sent();
              if (!response.ok) return [3 /*break*/, 3];
              return [4 /*yield*/, response.json()];
            case 2:
              data = _a.sent();
              setAmazonEmail(data.amazonEmail || "");
              setAmazonConfigured(data.amazonConfigured || false);
              setHomeAssistantUrl(data.homeAssistantUrl || "");
              setDeviceCredentials(data.deviceCredentials || []);
              _a.label = 3;
            case 3:
              return [3 /*break*/, 6];
            case 4:
              error_1 = _a.sent();
              console.error("Error fetching integration settings:", error_1);
              return [3 /*break*/, 6];
            case 5:
              setLoadingSettings(false);
              return [7 /*endfinally*/];
            case 6:
              return [2 /*return*/];
          }
        });
      });
    };
    fetchSettings();
  }, []);
  var handleSaveSettings = function () {
    setNotification({
      id: Date.now().toString(),
      title: "Settings Saved",
      message: "Your settings have been saved successfully.",
      icon: "settings-3-line",
      type: "success",
      timestamp: new Date(),
      read: false,
    });
  };
  var handleSaveIntegrations = function (e) {
    return __awaiter(_this, void 0, void 0, function () {
      var response, errorData, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            e.preventDefault();
            setIsLoading(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 5, 6, 7]);
            return [
              4 /*yield*/,
              (0, queryClient_1.apiRequest)(
                "POST",
                "/api/settings/integrations",
                {
                  amazonEmail: amazonEmail,
                  amazonPassword: amazonPassword,
                  deviceCredentials: deviceCredentials,
                  homeAssistantUrl: homeAssistantUrl,
                },
              ),
            ];
          case 2:
            response = _a.sent();
            if (!!response.ok) return [3 /*break*/, 4];
            return [4 /*yield*/, response.json()];
          case 3:
            errorData = _a.sent();
            throw new Error(
              errorData.error || "Failed to save integration settings",
            );
          case 4:
            // Update state to reflect new configuration status
            if (amazonEmail && amazonPassword) {
              setAmazonConfigured(true);
            }
            setNotification({
              id: Date.now().toString(),
              title: "Integration Settings Saved",
              message:
                "Your integration settings have been updated successfully.",
              icon: "settings-3-line",
              type: "success",
              timestamp: new Date(),
              read: false,
            });
            // Clear password field after successful save
            setAmazonPassword("");
            return [3 /*break*/, 7];
          case 5:
            error_2 = _a.sent();
            console.error("Error saving integration settings:", error_2);
            setError(
              error_2.message || "Failed to save settings. Please try again.",
            );
            return [3 /*break*/, 7];
          case 6:
            setIsLoading(false);
            return [7 /*endfinally*/];
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent_1.default />

      <main className="flex flex-col px-4 py-6 flex-grow">
        <div className="container mx-auto">
          <div className="flex items-center mb-6">
            <h1 className="text-3xl font-bold text-[#00FFFF]">Settings</h1>
          </div>

          <tabs_1.Tabs defaultValue="general" className="w-full">
            <tabs_1.TabsList className="grid grid-cols-4 max-w-xl mb-6">
              <tabs_1.TabsTrigger value="general">General</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="integrations">
                Integrations
              </tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="security">Security</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="about">About</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="general">
              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-white">
                    General Settings
                  </card_1.CardTitle>
                  <card_1.CardDescription>
                    Configure general system settings
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="system-name">
                      System Name
                    </label_1.Label>
                    <input_1.Input
                      id="system-name"
                      defaultValue="JASON"
                      className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="dark-mode">
                        Dark Mode
                      </label_1.Label>
                      <p className="text-sm text-gray-500">
                        Enable or disable dark mode
                      </p>
                    </div>
                    <switch_1.Switch id="dark-mode" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="notifications">
                        Notifications
                      </label_1.Label>
                      <p className="text-sm text-gray-500">
                        Enable or disable system notifications
                      </p>
                    </div>
                    <switch_1.Switch id="notifications" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="analytics">
                        Anonymous Analytics
                      </label_1.Label>
                      <p className="text-sm text-gray-500">
                        Help improve JASON by sending anonymous usage data
                      </p>
                    </div>
                    <switch_1.Switch id="analytics" />
                  </div>

                  <button_1.Button
                    className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black"
                    onClick={handleSaveSettings}
                  >
                    Save Settings
                  </button_1.Button>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="integrations">
              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-white">
                    Integration Settings
                  </card_1.CardTitle>
                  <card_1.CardDescription>
                    Configure device and service integrations
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-6">
                  <form onSubmit={handleSaveIntegrations} className="space-y-6">
                    <div className="p-4 border border-[#00FFFF]/40 rounded-md bg-[#0D1117] mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[#00FFFF] text-lg font-medium">
                          Device Credentials
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        Add login credentials for your smart devices. This
                        allows JASON to control devices that require
                        authentication.
                      </p>

                      {deviceCredentials.map(function (cred, index) {
                        return (
                          <div
                            key={index}
                            className="p-3 border border-[#00FFFF]/20 rounded-md mb-3 bg-[#0D1117]"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">
                                {cred.deviceId}
                              </span>
                              <button_1.Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[#FF0066] hover:text-[#FF0066]/80 hover:bg-[#FF0066]/10"
                                onClick={function () {
                                  var newCreds = __spreadArray(
                                    [],
                                    deviceCredentials,
                                    true,
                                  );
                                  newCreds.splice(index, 1);
                                  setDeviceCredentials(newCreds);
                                }}
                              >
                                Remove
                              </button_1.Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input_1.Input
                                placeholder="Username"
                                className="bg-[#0D1117] border-[#00FFFF]/50 focus:border-[#00FFFF] text-white"
                                value={cred.username}
                                onChange={function (e) {
                                  var newCreds = __spreadArray(
                                    [],
                                    deviceCredentials,
                                    true,
                                  );
                                  newCreds[index].username = e.target.value;
                                  setDeviceCredentials(newCreds);
                                }}
                              />
                              <input_1.Input
                                type="password"
                                placeholder="Password"
                                className="bg-[#0D1117] border-[#00FFFF]/50 focus:border-[#00FFFF] text-white"
                                value={cred.password}
                                onChange={function (e) {
                                  var newCreds = __spreadArray(
                                    [],
                                    deviceCredentials,
                                    true,
                                  );
                                  newCreds[index].password = e.target.value;
                                  setDeviceCredentials(newCreds);
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <button_1.Button
                        variant="outline"
                        className="w-full mt-2 border-dashed border-[#00FFFF]/50 text-[#00FFFF] hover:bg-[#00FFFF]/10"
                        onClick={function () {
                          setDeviceCredentials(
                            __spreadArray(
                              __spreadArray([], deviceCredentials, true),
                              [{ deviceId: "", username: "", password: "" }],
                              false,
                            ),
                          );
                        }}
                      >
                        + Add Device Credentials
                      </button_1.Button>
                    </div>

                    <div className="p-4 border border-[#FF0066]/40 rounded-md bg-[#0D1117] mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[#FF0066] text-lg font-medium">
                          Amazon Alexa Integration
                        </h3>
                        {amazonConfigured && (
                          <div className="flex items-center text-xs text-[#00FF00]">
                            <lucide_react_1.CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        Authentication required for Alexa device control. Your
                        credentials are securely stored and only used to
                        communicate with Amazon's Alexa service.
                      </p>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label_1.Label htmlFor="amazon-email">
                            Amazon Email
                          </label_1.Label>
                          <input_1.Input
                            id="amazon-email"
                            type="email"
                            placeholder="your-email@example.com"
                            className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                            value={amazonEmail}
                            onChange={function (e) {
                              return setAmazonEmail(e.target.value);
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label_1.Label htmlFor="amazon-password">
                            Amazon Password
                          </label_1.Label>
                          <input_1.Input
                            id="amazon-password"
                            type="password"
                            placeholder={
                              amazonConfigured
                                ? "••••••••••••••••••••"
                                : "Your Amazon password"
                            }
                            className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                            value={amazonPassword}
                            onChange={function (e) {
                              return setAmazonPassword(e.target.value);
                            }}
                          />
                          {amazonConfigured && (
                            <p className="text-xs text-[#00FF00]">
                              Password saved. Enter new password only if you
                              want to change it.
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#FF0066] mt-4">
                        {!amazonConfigured &&
                          "⚠️ Amazon credentials required for Alexa functionality. Devices are discovered but cannot be controlled without authentication."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label_1.Label htmlFor="home-assistant">
                        Home Assistant URL
                      </label_1.Label>
                      <input_1.Input
                        id="home-assistant"
                        placeholder="http://homeassistant.local:8123"
                        className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                        value={homeAssistantUrl}
                        onChange={function (e) {
                          return setHomeAssistantUrl(e.target.value);
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Optional: Connect to Home Assistant
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 rounded bg-[#FF0066]/10 border border-[#FF0066]/30 text-[#FF0066] flex items-start gap-2">
                        <lucide_react_1.AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    <button_1.Button
                      type="submit"
                      className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Integration Settings"
                      )}
                    </button_1.Button>
                  </form>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="security">
              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-white">
                    Security Settings
                  </card_1.CardTitle>
                  <card_1.CardDescription>
                    Configure security and access settings
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="current-password">
                      Current Password
                    </label_1.Label>
                    <input_1.Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label_1.Label htmlFor="new-password">
                      New Password
                    </label_1.Label>
                    <input_1.Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label_1.Label htmlFor="confirm-password">
                      Confirm Password
                    </label_1.Label>
                    <input_1.Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      className="bg-[#0D1117] border-[#00FFFF] focus:border-[#00FFFF] text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="two-factor">
                        Two-Factor Authentication
                      </label_1.Label>
                      <p className="text-sm text-gray-500">
                        Enable or disable 2FA
                      </p>
                    </div>
                    <switch_1.Switch id="two-factor" />
                  </div>

                  <button_1.Button
                    className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black"
                    onClick={handleSaveSettings}
                  >
                    Save Security Settings
                  </button_1.Button>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="about">
              <card_1.Card className="bg-[#1A1A1A] border border-[#00FFFF]/30">
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-white">
                    About JASON
                  </card_1.CardTitle>
                  <card_1.CardDescription>
                    System information
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      JASON (The Omnipotent AI Architect)
                    </h3>
                    <p className="text-gray-400">
                      A futuristic AI control interface for digital and physical
                      world interactions.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Version</p>
                      <p className="text-white">1.0.0</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Build Date</p>
                      <p className="text-white">May 4, 2025</p>
                    </div>
                    <div>
                      <p className="text-gray-500">License</p>
                      <p className="text-white">Proprietary</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="text-[#00FF00]">Operational</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#00FFFF]/30">
                    <h4 className="text-white mb-2">System Requirements</h4>
                    <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                      <li>Modern web browser with JavaScript enabled</li>
                      <li>Internet connection for external API services</li>
                      <li>API keys for integrated services</li>
                    </ul>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </div>
      </main>

      <FooterComponent_1.default />

      <NotificationPanel_1.default
        notification={notification}
        onClose={function () {
          return setNotification(null);
        }}
      />
    </div>
  );
}
