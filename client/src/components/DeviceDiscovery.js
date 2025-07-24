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
var material_1 = require("@mui/material");
var icons_material_1 = require("@mui/icons-material");
var DeviceDiscovery = function () {
  var _a = (0, react_1.useState)([]),
    devices = _a[0],
    setDevices = _a[1];
  var _b = (0, react_1.useState)(null),
    selectedDevice = _b[0],
    setSelectedDevice = _b[1];
  var _c = (0, react_1.useState)(null),
    ws = _c[0],
    setWs = _c[1];
  (0, react_1.useEffect)(function () {
    // Connect to WebSocket server
    var socket = new WebSocket("ws://localhost:8990");
    socket.onopen = function () {
      console.log("Connected to device integration service");
      // Register this device
      socket.send(
        JSON.stringify({
          type: "register",
          device: {
            platform: /iPhone|iPad|iPod/.test(navigator.userAgent)
              ? "ios"
              : "android",
            name: navigator.platform,
          },
        }),
      );
    };
    socket.onmessage = function (event) {
      var data = JSON.parse(event.data);
      switch (data.type) {
        case "deviceList":
          setDevices(data.devices);
          break;
        case "fileShareRequest":
          handleFileShareRequest(data);
          break;
        case "screenShareRequest":
          handleScreenShareRequest(data);
          break;
      }
    };
    setWs(socket);
    return function () {
      socket.close();
    };
  }, []);
  var handleFileShareRequest = function (data) {
    return __awaiter(void 0, void 0, void 0, function () {
      var transferId, sourceDevice, fileInfo;
      return __generator(this, function (_a) {
        ((transferId = data.transferId),
          (sourceDevice = data.sourceDevice),
          (fileInfo = data.fileInfo));
        // Show file share request notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("File Share Request", {
            body: ""
              .concat(sourceDevice.name, " wants to share ")
              .concat(fileInfo.name),
            icon: "/icons/file-share.png",
          });
        }
        return [2 /*return*/];
      });
    });
  };
  var handleScreenShareRequest = function (data) {
    return __awaiter(void 0, void 0, void 0, function () {
      var sessionId, sourceDevice;
      return __generator(this, function (_a) {
        ((sessionId = data.sessionId), (sourceDevice = data.sourceDevice));
        // Show screen share request notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Screen Share Request", {
            body: "".concat(sourceDevice.name, " wants to share their screen"),
            icon: "/icons/screen-share.png",
          });
        }
        return [2 /*return*/];
      });
    });
  };
  var shareFile = function (targetDeviceId) {
    return __awaiter(void 0, void 0, void 0, function () {
      var fileHandle, file;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              window
                .showOpenFilePicker({
                  multiple: false,
                })
                .then(function (handles) {
                  return handles[0];
                }),
            ];
          case 1:
            fileHandle = _a.sent();
            return [4 /*yield*/, fileHandle.getFile()];
          case 2:
            file = _a.sent();
            // Initiate file share
            ws === null || ws === void 0
              ? void 0
              : ws.send(
                  JSON.stringify({
                    type: "fileShare",
                    sourceDeviceId: "this-device-id",
                    targetDeviceId: targetDeviceId,
                    fileInfo: {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    },
                  }),
                );
            return [2 /*return*/];
        }
      });
    });
  };
  var shareScreen = function (targetDeviceId) {
    return __awaiter(void 0, void 0, void 0, function () {
      var stream, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
              }),
            ];
          case 1:
            stream = _a.sent();
            // Initiate screen share
            ws === null || ws === void 0
              ? void 0
              : ws.send(
                  JSON.stringify({
                    type: "screenShare",
                    sourceDeviceId: "this-device-id",
                    targetDeviceId: targetDeviceId,
                  }),
                );
            return [3 /*break*/, 3];
          case 2:
            error_1 = _a.sent();
            console.error("Screen sharing error:", error_1);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  return (
    <material_1.Container maxWidth="lg" sx={{ py: 4 }}>
      <material_1.Typography variant="h4" gutterBottom>
        Nearby Devices
      </material_1.Typography>

      <material_1.Grid container spacing={3}>
        {devices.map(function (device) {
          return (
            <material_1.Grid item xs={12} sm={6} md={4} key={device.id}>
              <material_1.Card
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  cursor: "pointer",
                  bgcolor:
                    selectedDevice === device.id
                      ? "action.selected"
                      : "background.paper",
                }}
                onClick={function () {
                  return setSelectedDevice(device.id);
                }}
              >
                <material_1.Box
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <icons_material_1.DeviceHub />
                  <material_1.Box>
                    <material_1.Typography variant="h6">
                      {device.name}
                    </material_1.Typography>
                    <material_1.Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {device.platform}
                    </material_1.Typography>
                  </material_1.Box>
                </material_1.Box>

                <material_1.Box sx={{ display: "flex", gap: 1 }}>
                  {device.preferences.fileSharing && (
                    <material_1.Button
                      variant="contained"
                      startIcon={<icons_material_1.Share />}
                      onClick={function () {
                        return shareFile(device.id);
                      }}
                    >
                      Share Files
                    </material_1.Button>
                  )}

                  {device.preferences.screenSharing && (
                    <material_1.Button
                      variant="contained"
                      startIcon={<icons_material_1.ScreenShare />}
                      onClick={function () {
                        return shareScreen(device.id);
                      }}
                    >
                      Share Screen
                    </material_1.Button>
                  )}
                </material_1.Box>
              </material_1.Card>
            </material_1.Grid>
          );
        })}
      </material_1.Grid>
    </material_1.Container>
  );
};
exports.default = DeviceDiscovery;
