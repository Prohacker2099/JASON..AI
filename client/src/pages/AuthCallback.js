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
var react_router_dom_1 = require("react-router-dom");
var card_1 = require("../components/ui/card");
var lucide_react_1 = require("lucide-react");
var AuthCallback = function () {
  var _a = (0, react_1.useState)("loading"),
    status = _a[0],
    setStatus = _a[1];
  var _b = (0, react_1.useState)("Processing authentication..."),
    message = _b[0],
    setMessage = _b[1];
  var navigate = (0, react_router_dom_1.useNavigate)();
  var location = (0, react_router_dom_1.useLocation)();
  (0, react_1.useEffect)(
    function () {
      var handleCallback = function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var params, code, state, redirectUri, response, errorData, error_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 4, , 5]);
                params = new URLSearchParams(location.search);
                code = params.get("code");
                state = params.get("state");
                if (!code || !state) {
                  setStatus("error");
                  setMessage("Missing required parameters");
                  return [2 /*return*/];
                }
                redirectUri = "".concat(
                  window.location.origin,
                  "/auth-callback",
                );
                return [
                  4 /*yield*/,
                  fetch("/api/integrations/oauth-callback", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      code: code,
                      state: state,
                      redirectUri: redirectUri,
                    }),
                  }),
                ];
              case 1:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
              case 2:
                errorData = _a.sent();
                throw new Error(errorData.error || "Authentication failed");
              case 3:
                setStatus("success");
                setMessage("Authentication successful! Redirecting...");
                // Redirect after a short delay
                setTimeout(function () {
                  navigate("/integrations");
                }, 2000);
                return [3 /*break*/, 5];
              case 4:
                error_1 = _a.sent();
                console.error("Error handling auth callback:", error_1);
                setStatus("error");
                setMessage(
                  error_1 instanceof Error
                    ? error_1.message
                    : "Authentication failed",
                );
                return [3 /*break*/, 5];
              case 5:
                return [2 /*return*/];
            }
          });
        });
      };
      handleCallback();
    },
    [location, navigate],
  );
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader>
          <card_1.CardTitle>Service Authentication</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="flex flex-col items-center justify-center p-6">
          {status === "loading" && (
            <>
              <lucide_react_1.Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-center text-green-600 font-medium">
                {message}
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
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
              </div>
              <p className="text-center text-red-600">{message}</p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
                onClick={function () {
                  return navigate("/integrations");
                }}
              >
                Return to Integrations
              </button>
            </>
          )}
        </card_1.CardContent>
      </card_1.Card>
    </div>
  );
};
exports.default = AuthCallback;
