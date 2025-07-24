"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
var framer_motion_1 = require("framer-motion");
var AdaptiveCard_1 = require("../components/AdaptiveCard");
var CloudSettings = function () {
  var _a = (0, react_1.useState)([]),
    cloudFeatures = _a[0],
    setCloudFeatures = _a[1];
  var _b = (0, react_1.useState)([]),
    dataSharingPolicies = _b[0],
    setDataSharingPolicies = _b[1];
  var _c = (0, react_1.useState)(true),
    isLoading = _c[0],
    setIsLoading = _c[1];
  var _d = (0, react_1.useState)(null),
    encryptionKey = _d[0],
    setEncryptionKey = _d[1];
  var _e = (0, react_1.useState)("idle"),
    backupStatus = _e[0],
    setBackupStatus = _e[1];
  var _f = (0, react_1.useState)(null),
    lastBackupDate = _f[0],
    setLastBackupDate = _f[1];
  var _g = (0, react_1.useState)(null),
    remoteAccessUrl = _g[0],
    setRemoteAccessUrl = _g[1];
  (0, react_1.useEffect)(function () {
    var fetchCloudSettings = function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var featuresResponse,
          policiesResponse,
          keyResponse,
          backupResponse,
          remoteAccessResponse,
          featuresData,
          policiesData,
          keyData,
          backupData,
          remoteAccessData,
          error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              setIsLoading(true);
              _a.label = 1;
            case 1:
              _a.trys.push([1, 14, 15, 16]);
              return [4 /*yield*/, fetch("/api/cloud/features")];
            case 2:
              featuresResponse = _a.sent();
              return [4 /*yield*/, fetch("/api/cloud/data-sharing")];
            case 3:
              policiesResponse = _a.sent();
              return [4 /*yield*/, fetch("/api/cloud/encryption-key")];
            case 4:
              keyResponse = _a.sent();
              return [4 /*yield*/, fetch("/api/cloud/backup-status")];
            case 5:
              backupResponse = _a.sent();
              return [4 /*yield*/, fetch("/api/cloud/remote-access")];
            case 6:
              remoteAccessResponse = _a.sent();
              if (!(featuresResponse.ok && policiesResponse.ok))
                return [3 /*break*/, 12];
              return [4 /*yield*/, featuresResponse.json()];
            case 7:
              featuresData = _a.sent();
              return [4 /*yield*/, policiesResponse.json()];
            case 8:
              policiesData = _a.sent();
              return [4 /*yield*/, keyResponse.json()];
            case 9:
              keyData = _a.sent();
              return [4 /*yield*/, backupResponse.json()];
            case 10:
              backupData = _a.sent();
              return [4 /*yield*/, remoteAccessResponse.json()];
            case 11:
              remoteAccessData = _a.sent();
              setCloudFeatures(featuresData);
              setDataSharingPolicies(policiesData);
              setEncryptionKey(keyData.key);
              setLastBackupDate(backupData.lastBackup);
              setRemoteAccessUrl(remoteAccessData.url);
              return [3 /*break*/, 13];
            case 12:
              throw new Error("Failed to fetch cloud settings");
            case 13:
              return [3 /*break*/, 16];
            case 14:
              error_1 = _a.sent();
              console.error("Error fetching cloud settings:", error_1);
              // Mock data for development
              setCloudFeatures([
                {
                  id: "backups",
                  name: "Secure Cloud Backups",
                  description:
                    "Automatically backup your configuration and settings to the cloud with end-to-end encryption.",
                  enabled: true,
                  premium: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  ),
                },
                {
                  id: "remoteAccess",
                  name: "Secure Remote Access",
                  description:
                    "Access your smart home securely from anywhere using end-to-end encrypted connections.",
                  enabled: false,
                  premium: true,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "voiceAssistants",
                  name: "Voice Assistant Integration",
                  description:
                    "Connect to popular voice assistants like Alexa, Google Assistant, and Siri.",
                  enabled: true,
                  premium: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "aiInsights",
                  name: "AI Insights & Recommendations",
                  description:
                    "Get personalized insights and recommendations based on your usage patterns.",
                  enabled: false,
                  premium: true,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "updates",
                  name: "Automatic Updates",
                  description:
                    "Keep your system up to date with the latest features and security patches.",
                  enabled: true,
                  premium: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ),
                },
              ]);
              setDataSharingPolicies([
                {
                  id: "deviceUsage",
                  name: "Device Usage Data",
                  description:
                    "Share anonymized device usage statistics to improve recommendations.",
                  enabled: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "energyData",
                  name: "Energy Consumption Data",
                  description:
                    "Share anonymized energy usage data to improve efficiency recommendations.",
                  enabled: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "environmentalData",
                  name: "Environmental Data",
                  description:
                    "Share anonymized temperature, humidity, and air quality data.",
                  enabled: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "locationData",
                  name: "Location Data",
                  description:
                    "Share anonymized presence and location data within your home.",
                  enabled: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "userActivity",
                  name: "User Activity Patterns",
                  description:
                    "Share anonymized usage patterns to improve automation suggestions.",
                  enabled: false,
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ),
                },
              ]);
              setEncryptionKey(
                "f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0",
              );
              setLastBackupDate("2023-06-15T14:32:10Z");
              setRemoteAccessUrl(null);
              return [3 /*break*/, 16];
            case 15:
              setIsLoading(false);
              return [7 /*endfinally*/];
            case 16:
              return [2 /*return*/];
          }
        });
      });
    };
    fetchCloudSettings();
  }, []);
  var toggleFeature = function (featureId) {
    return __awaiter(void 0, void 0, void 0, function () {
      var updatedFeatures, feature, response, data, error_2;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            updatedFeatures = cloudFeatures.map(function (feature) {
              if (feature.id === featureId) {
                return __assign(__assign({}, feature), {
                  enabled: !feature.enabled,
                });
              }
              return feature;
            });
            setCloudFeatures(updatedFeatures);
            _b.label = 1;
          case 1:
            _b.trys.push([1, 9, , 10]);
            // Update feature on server
            return [
              4 /*yield*/,
              fetch("/api/cloud/features/".concat(featureId), {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  enabled:
                    (_a = updatedFeatures.find(function (f) {
                      return f.id === featureId;
                    })) === null || _a === void 0
                      ? void 0
                      : _a.enabled,
                }),
              }),
            ];
          case 2:
            // Update feature on server
            _b.sent();
            if (!(featureId === "remoteAccess")) return [3 /*break*/, 8];
            feature = updatedFeatures.find(function (f) {
              return f.id === featureId;
            });
            if (
              !(feature === null || feature === void 0
                ? void 0
                : feature.enabled)
            )
              return [3 /*break*/, 6];
            return [
              4 /*yield*/,
              fetch("/api/cloud/remote-access/enable", {
                method: "POST",
              }),
            ];
          case 3:
            response = _b.sent();
            if (!response.ok) return [3 /*break*/, 5];
            return [4 /*yield*/, response.json()];
          case 4:
            data = _b.sent();
            setRemoteAccessUrl(data.url);
            _b.label = 5;
          case 5:
            return [3 /*break*/, 8];
          case 6:
            // Disable remote access
            return [
              4 /*yield*/,
              fetch("/api/cloud/remote-access/disable", {
                method: "POST",
              }),
            ];
          case 7:
            // Disable remote access
            _b.sent();
            setRemoteAccessUrl(null);
            _b.label = 8;
          case 8:
            return [3 /*break*/, 10];
          case 9:
            error_2 = _b.sent();
            console.error(
              "Error toggling feature ".concat(featureId, ":"),
              error_2,
            );
            // Revert change on error
            setCloudFeatures(cloudFeatures);
            return [3 /*break*/, 10];
          case 10:
            return [2 /*return*/];
        }
      });
    });
  };
  var toggleDataSharing = function (policyId) {
    return __awaiter(void 0, void 0, void 0, function () {
      var updatedPolicies, error_3;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            updatedPolicies = dataSharingPolicies.map(function (policy) {
              if (policy.id === policyId) {
                return __assign(__assign({}, policy), {
                  enabled: !policy.enabled,
                });
              }
              return policy;
            });
            setDataSharingPolicies(updatedPolicies);
            _b.label = 1;
          case 1:
            _b.trys.push([1, 3, , 4]);
            // Update policy on server
            return [
              4 /*yield*/,
              fetch("/api/cloud/data-sharing/".concat(policyId), {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  enabled:
                    (_a = updatedPolicies.find(function (p) {
                      return p.id === policyId;
                    })) === null || _a === void 0
                      ? void 0
                      : _a.enabled,
                }),
              }),
            ];
          case 2:
            // Update policy on server
            _b.sent();
            return [3 /*break*/, 4];
          case 3:
            error_3 = _b.sent();
            console.error(
              "Error toggling data sharing policy ".concat(policyId, ":"),
              error_3,
            );
            // Revert change on error
            setDataSharingPolicies(dataSharingPolicies);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  var handleBackup = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setBackupStatus("backing-up");
            _a.label = 1;
          case 1:
            _a.trys.push([1, 6, 7, 8]);
            return [
              4 /*yield*/,
              fetch("/api/cloud/backup", {
                method: "POST",
              }),
            ];
          case 2:
            response = _a.sent();
            if (!response.ok) return [3 /*break*/, 4];
            return [4 /*yield*/, response.json()];
          case 3:
            data = _a.sent();
            setLastBackupDate(data.timestamp);
            return [3 /*break*/, 5];
          case 4:
            throw new Error("Backup failed");
          case 5:
            return [3 /*break*/, 8];
          case 6:
            error_4 = _a.sent();
            console.error("Error creating backup:", error_4);
            return [3 /*break*/, 8];
          case 7:
            setBackupStatus("idle");
            return [7 /*endfinally*/];
          case 8:
            return [2 /*return*/];
        }
      });
    });
  };
  var handleRestore = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, error_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (
              !window.confirm(
                "Are you sure you want to restore from the last backup? This will overwrite your current configuration.",
              )
            ) {
              return [2 /*return*/];
            }
            setBackupStatus("restoring");
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              fetch("/api/cloud/restore", {
                method: "POST",
              }),
            ];
          case 2:
            response = _a.sent();
            if (response.ok) {
              alert(
                "Restore completed successfully. The system will now reload.",
              );
              window.location.reload();
            } else {
              throw new Error("Restore failed");
            }
            return [3 /*break*/, 5];
          case 3:
            error_5 = _a.sent();
            console.error("Error restoring from backup:", error_5);
            alert("Failed to restore from backup. Please try again.");
            return [3 /*break*/, 5];
          case 4:
            setBackupStatus("idle");
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  var regenerateEncryptionKey = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, error_6;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (
              !window.confirm(
                "Are you sure you want to regenerate your encryption key? This will require re-encrypting all your data and creating a new backup.",
              )
            ) {
              return [2 /*return*/];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 6, , 7]);
            return [
              4 /*yield*/,
              fetch("/api/cloud/encryption-key/regenerate", {
                method: "POST",
              }),
            ];
          case 2:
            response = _a.sent();
            if (!response.ok) return [3 /*break*/, 4];
            return [4 /*yield*/, response.json()];
          case 3:
            data = _a.sent();
            setEncryptionKey(data.key);
            alert(
              "Encryption key regenerated successfully. Please create a new backup.",
            );
            return [3 /*break*/, 5];
          case 4:
            throw new Error("Failed to regenerate encryption key");
          case 5:
            return [3 /*break*/, 7];
          case 6:
            error_6 = _a.sent();
            console.error("Error regenerating encryption key:", error_6);
            alert("Failed to regenerate encryption key. Please try again.");
            return [3 /*break*/, 7];
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <framer_motion_1.motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white">
          Cloud & Privacy Settings
        </h1>
        <p className="mt-2 text-gray-400">
          Manage your cloud integration and privacy settings
        </p>
      </framer_motion_1.motion.div>

      {/* Encryption Key */}
      <AdaptiveCard_1.default
        title="End-to-End Encryption"
        priority="high"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        }
        className="mb-8"
      >
        <p className="mb-4 text-gray-300">
          All data sent to the cloud is encrypted using this key. The key is
          stored only on your local system and never sent to our servers.
        </p>

        <div className="mb-4 flex items-center">
          <input
            type="text"
            value={encryptionKey || ""}
            readOnly
            className="flex-1 rounded-l-md bg-gray-800 px-3 py-2 text-gray-300"
          />
          <button
            onClick={regenerateEncryptionKey}
            className="rounded-r-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Regenerate
          </button>
        </div>

        <div className="rounded-md bg-yellow-900/20 p-3 text-yellow-400">
          <p className="text-sm">
            <strong>Important:</strong> If you lose this key, you will not be
            able to decrypt your cloud data. Please save it in a secure
            location.
          </p>
        </div>
      </AdaptiveCard_1.default>

      {/* Cloud Backups */}
      <AdaptiveCard_1.default
        title="Cloud Backups"
        priority="medium"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
        }
        className="mb-8"
        expandable={true}
        initialState="expanded"
      >
        <div className="mb-4">
          <p className="mb-2 text-gray-300">
            Backup your configuration, scenes, and settings to the cloud. All
            data is encrypted before being sent to our servers.
          </p>

          {lastBackupDate && (
            <p className="text-sm text-gray-400">
              Last backup: {new Date(lastBackupDate).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleBackup}
            disabled={backupStatus !== "idle"}
            className={"rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 ".concat(
              backupStatus !== "idle" ? "cursor-not-allowed opacity-50" : "",
            )}
          >
            {backupStatus === "backing-up" ? "Backing up..." : "Create Backup"}
          </button>

          <button
            onClick={handleRestore}
            disabled={backupStatus !== "idle" || !lastBackupDate}
            className={"rounded border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-700 ".concat(
              backupStatus !== "idle" || !lastBackupDate
                ? "cursor-not-allowed opacity-50"
                : "",
            )}
          >
            {backupStatus === "restoring" ? "Restoring..." : "Restore"}
          </button>
        </div>
      </AdaptiveCard_1.default>

      {/* Cloud Features */}
      <h2 className="mb-4 text-2xl font-bold text-white">Cloud Features</h2>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {cloudFeatures.map(function (feature) {
          return (
            <AdaptiveCard_1.default
              key={feature.id}
              title={feature.name}
              priority="medium"
              icon={feature.icon}
              contextInfo={feature.premium ? "Premium Feature" : undefined}
            >
              <p className="mb-4 text-gray-300">{feature.description}</p>

              <div className="flex items-center justify-between">
                {feature.id === "remoteAccess" && remoteAccessUrl && (
                  <a
                    href={remoteAccessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Access URL
                  </a>
                )}

                <div className="flex-1"></div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={feature.enabled}
                    onChange={function () {
                      return toggleFeature(feature.id);
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-gray-300 after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                </label>
              </div>
            </AdaptiveCard_1.default>
          );
        })}
      </div>

      {/* Data Sharing */}
      <h2 className="mb-4 text-2xl font-bold text-white">Data Sharing</h2>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {dataSharingPolicies.map(function (policy) {
          return (
            <AdaptiveCard_1.default
              key={policy.id}
              title={policy.name}
              priority="low"
              icon={policy.icon}
            >
              <p className="mb-4 text-gray-300">{policy.description}</p>

              <div className="flex items-center justify-end">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={policy.enabled}
                    onChange={function () {
                      return toggleDataSharing(policy.id);
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-gray-300 after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                </label>
              </div>
            </AdaptiveCard_1.default>
          );
        })}
      </div>

      {/* Privacy Policy */}
      <AdaptiveCard_1.default
        title="Privacy Policy"
        priority="low"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
      >
        <p className="mb-4 text-gray-300">
          JASON is designed with privacy at its core. We believe your home data
          should remain private and under your control.
        </p>

        <ul className="mb-4 list-inside list-disc space-y-2 text-gray-300">
          <li>All data is processed locally by default</li>
          <li>Cloud features are optional and disabled by default</li>
          <li>All cloud data is end-to-end encrypted</li>
          <li>You can delete your cloud data at any time</li>
          <li>We never sell your data to third parties</li>
        </ul>

        <a href="/privacy-policy" className="text-blue-400 hover:text-blue-300">
          Read our full privacy policy
        </a>
      </AdaptiveCard_1.default>
    </div>
  );
};
exports.default = CloudSettings;
