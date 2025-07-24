"use strict";
/**
 * Roadmap Service
 *
 * This service provides client-side functions to interact with the JASON roadmap API endpoints.
 * It connects to real backend services and handles data transformation.
 */
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
exports.getDeviceUpdateHistory =
  exports.updateDeviceFirmware =
  exports.getFirmwareVersions =
  exports.getDeviceHealthReport =
  exports.getDeviceDetails =
  exports.getHardwareDevices =
  exports.installExtension =
  exports.getExtensionDetails =
  exports.searchExtensions =
  exports.getFeaturedExtensions =
  exports.getExtensions =
  exports.getUserCompensation =
  exports.updateUserConsent =
  exports.getUserConsent =
  exports.getDataPartners =
  exports.getDataClassifications =
  exports.getPredictions =
  exports.trainAIModels =
  exports.getAILearningStatus =
  exports.startDeviceDiscovery =
  exports.getDeviceIntegrationStatus =
    void 0;
var axios_1 = require("axios");
var use_toast_1 = require("../components/ui/use-toast");
var API_URL = "/api/roadmap";
// Error handling wrapper
var handleApiRequest = function (requestFn, errorMessage) {
  return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [4 /*yield*/, requestFn()];
        case 1:
          return [2 /*return*/, _a.sent()];
        case 2:
          error_1 = _a.sent();
          console.error("".concat(errorMessage, ":"), error_1);
          (0, use_toast_1.toast)({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw error_1;
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
// Device Integration
var getDeviceIntegrationStatus = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      "".concat(API_URL, "/device-integration/status"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get device integration status"),
      ];
    });
  });
};
exports.getDeviceIntegrationStatus = getDeviceIntegrationStatus;
var startDeviceDiscovery = function (protocols) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.post(
                      "".concat(API_URL, "/device-integration/discover"),
                      { protocols: protocols },
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  (0, use_toast_1.toast)({
                    title: "Device Discovery",
                    description: "Device discovery started successfully",
                  });
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to start device discovery"),
      ];
    });
  });
};
exports.startDeviceDiscovery = startDeviceDiscovery;
// AI Learning Engine
var getAILearningStatus = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      "".concat(API_URL, "/ai-learning/status"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get AI learning status"),
      ];
    });
  });
};
exports.getAILearningStatus = getAILearningStatus;
var trainAIModels = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.post(
                      "".concat(API_URL, "/ai-learning/train"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  (0, use_toast_1.toast)({
                    title: "AI Training",
                    description: "AI model training started successfully",
                  });
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to start AI model training"),
      ];
    });
  });
};
exports.trainAIModels = trainAIModels;
var getPredictions = function (context) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.post(
                      "".concat(API_URL, "/ai-learning/predict"),
                      { context: context },
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get predictions"),
      ];
    });
  });
};
exports.getPredictions = getPredictions;
// Data Dividend Framework
var getDataClassifications = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      "".concat(API_URL, "/data-dividend/classifications"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get data classifications"),
      ];
    });
  });
};
exports.getDataClassifications = getDataClassifications;
var getDataPartners = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      "".concat(API_URL, "/data-dividend/partners"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get data partners"),
      ];
    });
  });
};
exports.getDataPartners = getDataPartners;
var getUserConsent = function (userId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      ""
                        .concat(API_URL, "/data-dividend/user-consent?userId=")
                        .concat(userId),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get user consent information"),
      ];
    });
  });
};
exports.getUserConsent = getUserConsent;
var updateUserConsent = function (
  userId,
  dataCategory,
  granted,
  purposes,
  partners,
  expiresAt,
) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.post(
                      "".concat(API_URL, "/data-dividend/consent"),
                      {
                        userId: userId,
                        dataCategory: dataCategory,
                        granted: granted,
                        purposes: purposes,
                        partners: partners,
                        expiresAt: expiresAt,
                      },
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  (0, use_toast_1.toast)({
                    title: "Consent Updated",
                    description: "Consent for "
                      .concat(dataCategory, " has been ")
                      .concat(granted ? "granted" : "revoked"),
                  });
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to update user consent"),
      ];
    });
  });
};
exports.updateUserConsent = updateUserConsent;
var getUserCompensation = function (userId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      ""
                        .concat(API_URL, "/data-dividend/compensation?userId=")
                        .concat(userId),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get user compensation information"),
      ];
    });
  });
};
exports.getUserCompensation = getUserCompensation;
// Developer Marketplace
var getExtensions = function (filters) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var url, params, response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  url = "".concat(API_URL, "/marketplace/extensions");
                  if (filters) {
                    params = new URLSearchParams();
                    if (filters.category)
                      params.append("category", filters.category);
                    if (filters.developerId)
                      params.append("developerId", filters.developerId);
                    if (filters.status) params.append("status", filters.status);
                    if (filters.tags)
                      params.append("tags", filters.tags.join(","));
                    if (filters.pricingModel)
                      params.append("pricingModel", filters.pricingModel);
                    if (params.toString()) {
                      url += "?".concat(params.toString());
                    }
                  }
                  return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get extensions"),
      ];
    });
  });
};
exports.getExtensions = getExtensions;
var getFeaturedExtensions = function (limit) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  url = limit
                    ? ""
                        .concat(
                          API_URL,
                          "/marketplace/extensions/featured?limit=",
                        )
                        .concat(limit)
                    : "".concat(API_URL, "/marketplace/extensions/featured");
                  return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get featured extensions"),
      ];
    });
  });
};
exports.getFeaturedExtensions = getFeaturedExtensions;
var searchExtensions = function (query) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(
          function () {
            return __awaiter(void 0, void 0, void 0, function () {
              var response;
              return __generator(this, function (_a) {
                switch (_a.label) {
                  case 0:
                    return [
                      4 /*yield*/,
                      axios_1.default.get(
                        ""
                          .concat(API_URL, "/marketplace/extensions/search?q=")
                          .concat(encodeURIComponent(query)),
                      ),
                    ];
                  case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
                }
              });
            });
          },
          'Failed to search for "'.concat(query, '"'),
        ),
      ];
    });
  });
};
exports.searchExtensions = searchExtensions;
var getExtensionDetails = function (extensionId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      ""
                        .concat(API_URL, "/marketplace/extensions/")
                        .concat(extensionId),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get extension details"),
      ];
    });
  });
};
exports.getExtensionDetails = getExtensionDetails;
var installExtension = function (userId, extensionId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.post(
                      ""
                        .concat(API_URL, "/marketplace/extensions/")
                        .concat(extensionId, "/install"),
                      { userId: userId },
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  (0, use_toast_1.toast)({
                    title: "Extension Installed",
                    description:
                      "The extension has been successfully installed",
                  });
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to install extension"),
      ];
    });
  });
};
exports.installExtension = installExtension;
// Hardware Hub
var getHardwareDevices = function (owner) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  url = owner
                    ? ""
                        .concat(API_URL, "/hardware/devices?owner=")
                        .concat(owner)
                    : "".concat(API_URL, "/hardware/devices");
                  return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get hardware devices"),
      ];
    });
  });
};
exports.getHardwareDevices = getHardwareDevices;
var getDeviceDetails = function (deviceId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      "".concat(API_URL, "/hardware/devices/").concat(deviceId),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get device details"),
      ];
    });
  });
};
exports.getDeviceDetails = getDeviceDetails;
var getDeviceHealthReport = function (deviceId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      ""
                        .concat(API_URL, "/hardware/devices/")
                        .concat(deviceId, "/health"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get device health report"),
      ];
    });
  });
};
exports.getDeviceHealthReport = getDeviceHealthReport;
var getFirmwareVersions = function (model) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      ""
                        .concat(API_URL, "/hardware/firmware?model=")
                        .concat(model),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get firmware versions"),
      ];
    });
  });
};
exports.getFirmwareVersions = getFirmwareVersions;
var updateDeviceFirmware = function (deviceId, targetVersion) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.post(
                      ""
                        .concat(API_URL, "/hardware/devices/")
                        .concat(deviceId, "/update"),
                      { targetVersion: targetVersion },
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  (0, use_toast_1.toast)({
                    title: "Firmware Update",
                    description: "Firmware update ".concat(
                      targetVersion ? "to ".concat(targetVersion) : "",
                      " has been initiated",
                    ),
                  });
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to update device firmware"),
      ];
    });
  });
};
exports.updateDeviceFirmware = updateDeviceFirmware;
var getDeviceUpdateHistory = function (deviceId) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [
        2 /*return*/,
        handleApiRequest(function () {
          return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    axios_1.default.get(
                      ""
                        .concat(API_URL, "/hardware/devices/")
                        .concat(deviceId, "/updates"),
                    ),
                  ];
                case 1:
                  response = _a.sent();
                  return [2 /*return*/, response.data];
              }
            });
          });
        }, "Failed to get device update history"),
      ];
    });
  });
};
exports.getDeviceUpdateHistory = getDeviceUpdateHistory;
// Export all functions as a single service object
var roadmapService = {
  // Device Integration
  getDeviceIntegrationStatus: exports.getDeviceIntegrationStatus,
  startDeviceDiscovery: exports.startDeviceDiscovery,
  // AI Learning Engine
  getAILearningStatus: exports.getAILearningStatus,
  trainAIModels: exports.trainAIModels,
  getPredictions: exports.getPredictions,
  // Data Dividend Framework
  getDataClassifications: exports.getDataClassifications,
  getDataPartners: exports.getDataPartners,
  getUserConsent: exports.getUserConsent,
  updateUserConsent: exports.updateUserConsent,
  getUserCompensation: exports.getUserCompensation,
  // Developer Marketplace
  getExtensions: exports.getExtensions,
  getFeaturedExtensions: exports.getFeaturedExtensions,
  searchExtensions: exports.searchExtensions,
  getExtensionDetails: exports.getExtensionDetails,
  installExtension: exports.installExtension,
  // Hardware Hub
  getHardwareDevices: exports.getHardwareDevices,
  getDeviceDetails: exports.getDeviceDetails,
  getDeviceHealthReport: exports.getDeviceHealthReport,
  getFirmwareVersions: exports.getFirmwareVersions,
  updateDeviceFirmware: exports.updateDeviceFirmware,
  getDeviceUpdateHistory: exports.getDeviceUpdateHistory,
};
exports.default = roadmapService;
