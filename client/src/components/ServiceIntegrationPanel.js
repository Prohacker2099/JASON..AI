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
var button_1 = require("./ui/button");
var alert_1 = require("./ui/alert");
var lucide_react_1 = require("lucide-react");
var ServiceIntegrationPanel = function () {
  var _a = (0, react_1.useState)([]),
    services = _a[0],
    setServices = _a[1];
  var _b = (0, react_1.useState)([]),
    authenticatedServices = _b[0],
    setAuthenticatedServices = _b[1];
  var _c = (0, react_1.useState)(true),
    loading = _c[0],
    setLoading = _c[1];
  var _d = (0, react_1.useState)(false),
    discovering = _d[0],
    setDiscovering = _d[1];
  var _e = (0, react_1.useState)(null),
    error = _e[0],
    setError = _e[1];
  var _f = (0, react_1.useState)(null),
    success = _f[0],
    setSuccess = _f[1];
  // Fetch services on component mount
  (0, react_1.useEffect)(function () {
    fetchServices();
    fetchAuthenticatedServices();
  }, []);
  // Fetch discovered services
  var fetchServices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, 4, 5]);
            setLoading(true);
            setError(null);
            return [4 /*yield*/, fetch("/api/integrations/services")];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch services");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setServices(data.services);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            setError("Failed to load services");
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
  // Fetch authenticated services
  var fetchAuthenticatedServices = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, data, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [4 /*yield*/, fetch("/api/integrations/authenticated")];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to fetch authenticated services");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            setAuthenticatedServices(data.services);
            return [3 /*break*/, 4];
          case 3:
            err_2 = _a.sent();
            console.error("Failed to load authenticated services:", err_2);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // Start discovery
  var startDiscovery = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var response, interval_1, err_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            setDiscovering(true);
            setError(null);
            setSuccess(null);
            return [
              4 /*yield*/,
              fetch("/api/integrations/discover", {
                method: "POST",
              }),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to start discovery");
            }
            setSuccess("Discovery started successfully");
            interval_1 = setInterval(function () {
              return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                  switch (_a.label) {
                    case 0:
                      return [4 /*yield*/, fetchServices()];
                    case 1:
                      _a.sent();
                      return [2 /*return*/];
                  }
                });
              });
            }, 2000);
            // Stop polling after 10 seconds
            setTimeout(function () {
              clearInterval(interval_1);
              setDiscovering(false);
            }, 10000);
            return [3 /*break*/, 3];
          case 2:
            err_3 = _a.sent();
            setError("Failed to start discovery");
            console.error(err_3);
            setDiscovering(false);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  // Authenticate with a service
  var authenticateService = function (service) {
    return __awaiter(void 0, void 0, void 0, function () {
      var redirectUri, response, data, credentials, response, err_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 6, , 7]);
            setError(null);
            setSuccess(null);
            if (!(service.authType === "oauth2")) return [3 /*break*/, 3];
            redirectUri = "".concat(window.location.origin, "/auth-callback");
            return [
              4 /*yield*/,
              fetch(
                "/api/integrations/auth-url/"
                  .concat(service.id, "?redirectUri=")
                  .concat(encodeURIComponent(redirectUri)),
              ),
            ];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to get authentication URL");
            }
            return [4 /*yield*/, response.json()];
          case 2:
            data = _a.sent();
            // Redirect to auth URL
            window.location.href = data.authUrl;
            return [3 /*break*/, 5];
          case 3:
            credentials = prompt(
              "Enter credentials for ".concat(service.name, ":"),
            );
            if (!credentials) return [2 /*return*/];
            return [
              4 /*yield*/,
              fetch("/api/integrations/authenticate/".concat(service.id), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ credentials: credentials }),
              }),
            ];
          case 4:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("Failed to authenticate service");
            }
            setSuccess("Successfully authenticated with ".concat(service.name));
            fetchAuthenticatedServices();
            _a.label = 5;
          case 5:
            return [3 /*break*/, 7];
          case 6:
            err_4 = _a.sent();
            setError("Failed to authenticate service");
            console.error(err_4);
            return [3 /*break*/, 7];
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  // Check if a service is authenticated
  var isAuthenticated = function (serviceId) {
    return authenticatedServices.some(function (s) {
      return s.id === serviceId;
    });
  };
  return (
    <card_1.Card className="w-full">
      <card_1.CardHeader>
        <card_1.CardTitle>Service Integrations</card_1.CardTitle>
        <card_1.CardDescription>
          Discover and connect to thousands of services and platforms
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        {error && (
          <alert_1.Alert variant="destructive" className="mb-4">
            <alert_1.AlertTitle>Error</alert_1.AlertTitle>
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>
        )}

        {success && (
          <alert_1.Alert className="mb-4 bg-green-50 border-green-200">
            <lucide_react_1.CheckCircle className="h-4 w-4 text-green-500" />
            <alert_1.AlertTitle className="text-green-700">
              Success
            </alert_1.AlertTitle>
            <alert_1.AlertDescription className="text-green-600">
              {success}
            </alert_1.AlertDescription>
          </alert_1.Alert>
        )}

        <div className="mb-4">
          <button_1.Button
            onClick={startDiscovery}
            disabled={discovering}
            className="flex items-center"
          >
            <lucide_react_1.RefreshCw
              className={"mr-2 h-4 w-4 ".concat(
                discovering ? "animate-spin" : "",
              )}
            />
            {discovering ? "Discovering..." : "Discover Services"}
          </button_1.Button>
        </div>

        <div className="space-y-4">
          {loading && !services.length ? (
            <p>Loading services...</p>
          ) : services.length === 0 ? (
            <alert_1.Alert>
              <lucide_react_1.InfoIcon className="h-4 w-4" />
              <alert_1.AlertTitle>No services found</alert_1.AlertTitle>
              <alert_1.AlertDescription>
                Click "Discover Services" to scan your network for compatible
                services.
              </alert_1.AlertDescription>
            </alert_1.Alert>
          ) : (
            services.map(function (service) {
              return (
                <div
                  key={service.id}
                  className="p-4 border rounded-md flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.platform}</p>
                  </div>
                  <button_1.Button
                    variant={
                      isAuthenticated(service.id) ? "outline" : "default"
                    }
                    onClick={function () {
                      return authenticateService(service);
                    }}
                    disabled={isAuthenticated(service.id)}
                  >
                    {isAuthenticated(service.id) ? (
                      <>
                        <lucide_react_1.CheckCircle className="mr-2 h-4 w-4" />
                        Connected
                      </>
                    ) : (
                      <>
                        <lucide_react_1.ExternalLink className="mr-2 h-4 w-4" />
                        Connect
                      </>
                    )}
                  </button_1.Button>
                </div>
              );
            })
          )}
        </div>
      </card_1.CardContent>
      <card_1.CardFooter>
        <p className="text-xs text-gray-500">
          JASON can integrate with thousands of services while keeping your data
          private and secure.
        </p>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = ServiceIntegrationPanel;
