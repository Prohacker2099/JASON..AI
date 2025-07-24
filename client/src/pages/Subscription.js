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
exports.default = Subscription;
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var react_stripe_js_1 = require("@stripe/react-stripe-js");
var stripe_js_1 = require("@stripe/stripe-js");
var card_1 = require("@/components/ui/card");
var button_1 = require("@/components/ui/button");
var badge_1 = require("@/components/ui/badge");
var lucide_react_1 = require("lucide-react");
var use_toast_1 = require("@/hooks/use-toast");
var queryClient_1 = require("@/lib/queryClient");
var SubscriptionForm_1 = require("@/components/SubscriptionForm");
// Load Stripe outside component to avoid recreation on renders
var stripePromise = (0, stripe_js_1.loadStripe)(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY,
);
// Define common features
var commonFeatures = [
  "QUANTUM AI TECHNOLOGY",
  "UNIVERSAL DEVICE INTEGRATION",
  "VOICE COMMAND TECHNOLOGY",
];
function Subscription() {
  var _this = this;
  var toast = (0, use_toast_1.useToast)().toast;
  var _a = (0, react_1.useState)(null),
    selectedPlan = _a[0],
    setSelectedPlan = _a[1];
  var _b = (0, react_1.useState)(null),
    clientSecret = _b[0],
    setClientSecret = _b[1];
  // Fetch subscription plans
  var _c = (0, react_query_1.useQuery)({
      queryKey: ["/api/subscription/plans"],
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
    plans = _c.data,
    isLoading = _c.isLoading,
    error = _c.error;
  // Handle plan selection
  var handleSelectPlan = function (planId) {
    return __awaiter(_this, void 0, void 0, function () {
      var userId, response, data, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setSelectedPlan(planId);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, , 5]);
            userId = 1;
            return [
              4 /*yield*/,
              (0, queryClient_1.apiRequest)(
                "POST",
                "/api/create-subscription",
                {
                  userId: userId,
                  planId: planId,
                  email: "user@example.com",
                  name: "JASON User",
                },
              ),
            ];
          case 2:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 3:
            data = _a.sent();
            if (data.clientSecret) {
              setClientSecret(data.clientSecret);
            } else {
              toast({
                title: "Error",
                description: "Could not create subscription. Please try again.",
                variant: "destructive",
              });
            }
            return [3 /*break*/, 5];
          case 4:
            error_1 = _a.sent();
            console.error("Error creating subscription:", error_1);
            toast({
              title: "Error",
              description: "Could not create subscription. Please try again.",
              variant: "destructive",
            });
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D1117] text-white p-6">
        <div className="animate-spin w-12 h-12 border-t-2 border-[#00FFFF] border-solid rounded-full"></div>
        <p className="mt-4 text-[#00FFFF]">Loading subscription plans...</p>
      </div>
    );
  }
  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D1117] text-white p-6">
        <div className="text-[#FF3300] text-6xl mb-4">
          <lucide_react_1.Info />
        </div>
        <h2 className="text-2xl font-bold text-[#FF3300] mb-2">
          Error Loading Plans
        </h2>
        <p className="text-gray-300">
          Could not load subscription plans. Please try again later.
        </p>
        <button_1.Button
          variant="outline"
          className="mt-6 border-[#FF3300] text-[#FF3300] hover:bg-[#FF3300]/10"
          onClick={function () {
            return window.location.reload();
          }}
        >
          Try Again
        </button_1.Button>
      </div>
    );
  }
  // If we have a client secret, show the payment form
  if (clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D1117] text-white p-6">
        <card_1.Card className="w-full max-w-2xl bg-[#1A1A1A] border border-[#00FFFF]/50 text-white">
          <card_1.CardHeader>
            <card_1.CardTitle className="text-2xl text-[#00FFFF]">
              Complete Your Subscription
            </card_1.CardTitle>
            <card_1.CardDescription className="text-gray-400">
              Enter your payment details to activate your subscription
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <react_stripe_js_1.Elements
              stripe={stripePromise}
              options={{ clientSecret: clientSecret }}
            >
              <SubscriptionForm_1.default />
            </react_stripe_js_1.Elements>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-end">
            <button_1.Button
              variant="outline"
              className="mr-2 border-[#1A1A1A] hover:bg-[#1A1A1A]/50 text-white"
              onClick={function () {
                return setClientSecret(null);
              }}
            >
              Back to Plans
            </button_1.Button>
          </card_1.CardFooter>
        </card_1.Card>
      </div>
    );
  }
  // Icon mapping for features
  var featureIcons = {
    "QUANTUM AI TECHNOLOGY": (
      <lucide_react_1.Cpu className="w-5 h-5 text-[#00FFFF]" />
    ),
    "UNIVERSAL DEVICE INTEGRATION": (
      <lucide_react_1.Globe className="w-5 h-5 text-[#00FFFF]" />
    ),
    "VOICE COMMAND TECHNOLOGY": (
      <lucide_react_1.Zap className="w-5 h-5 text-[#00FFFF]" />
    ),
    "Control up to 5 devices": (
      <lucide_react_1.Cloud className="w-5 h-5 text-[#00FFFF]" />
    ),
    "Email support": <lucide_react_1.Zap className="w-5 h-5 text-[#00FFFF]" />,
    "Basic neural adaptation": (
      <lucide_react_1.Cpu className="w-5 h-5 text-[#00FFFF]" />
    ),
    "Standard security layer": (
      <lucide_react_1.Shield className="w-5 h-5 text-[#00FFFF]" />
    ),
    "Unlimited devices": (
      <lucide_react_1.Cloud className="w-5 h-5 text-[#FF0066]" />
    ),
    "Priority support": (
      <lucide_react_1.Zap className="w-5 h-5 text-[#FF0066]" />
    ),
    "Enhanced security features": (
      <lucide_react_1.Shield className="w-5 h-5 text-[#FF0066]" />
    ),
    "Voice command customization": (
      <lucide_react_1.Cpu className="w-5 h-5 text-[#FF0066]" />
    ),
    "Neural-adaptive self-optimization": (
      <lucide_react_1.Cpu className="w-5 h-5 text-[#00FF00]" />
    ),
    "Quantum-grade security": (
      <lucide_react_1.Shield className="w-5 h-5 text-[#00FF00]" />
    ),
    "Full customization": (
      <lucide_react_1.Cloud className="w-5 h-5 text-[#00FF00]" />
    ),
    "24/7 dedicated support": (
      <lucide_react_1.Zap className="w-5 h-5 text-[#00FF00]" />
    ),
  };
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0D1117] text-white p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00FFFF] mb-3">
          JASON SUBSCRIPTION PLANS
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl">
          Choose the perfect plan to unleash the full potential of JASON's
          quantum AI technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {plans &&
          Array.isArray(plans) &&
          plans.map(function (plan) {
            return (
              <card_1.Card
                key={plan.planId}
                className={"bg-[#1A1A1A] border transition-all duration-300 hover:shadow-lg hover:shadow-[#00FFFF]/20 ".concat(
                  plan.planId === "quantum"
                    ? "border-[#00FF00]"
                    : plan.planId === "professional"
                      ? "border-[#FF0066]"
                      : "border-[#00FFFF]",
                )}
              >
                <card_1.CardHeader>
                  <div className="flex justify-between items-center">
                    <card_1.CardTitle
                      className={
                        plan.planId === "quantum"
                          ? "text-[#00FF00]"
                          : plan.planId === "professional"
                            ? "text-[#FF0066]"
                            : "text-[#00FFFF]"
                      }
                    >
                      {plan.name}
                    </card_1.CardTitle>
                    <badge_1.Badge
                      variant="outline"
                      className={
                        plan.planId === "quantum"
                          ? "border-[#00FF00] text-[#00FF00]"
                          : plan.planId === "professional"
                            ? "border-[#FF0066] text-[#FF0066]"
                            : "border-[#00FFFF] text-[#00FFFF]"
                      }
                    >
                      {plan.interval === "month" ? "Monthly" : "Yearly"}
                    </badge_1.Badge>
                  </div>
                  <card_1.CardDescription className="text-gray-400">
                    {plan.description}
                  </card_1.CardDescription>
                  <div className="mt-4">
                    <span
                      className={"text-3xl font-bold ".concat(
                        plan.planId === "quantum"
                          ? "text-[#00FF00]"
                          : plan.planId === "professional"
                            ? "text-[#FF0066]"
                            : "text-[#00FFFF]",
                      )}
                    >
                      ${(plan.price / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-400">/{plan.interval}</span>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  {/* Common features */}
                  <div className="space-y-2">
                    {commonFeatures.map(function (feature) {
                      return (
                        <div key={feature} className="flex items-center">
                          <lucide_react_1.CheckCircle className="w-5 h-5 mr-2 text-gray-500" />
                          <span className="text-gray-400">{feature}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Plan-specific features */}
                  <div className="space-y-2 border-t border-gray-800 pt-4">
                    {plan.features &&
                      Array.isArray(plan.features) &&
                      plan.features.map(function (feature) {
                        return (
                          <div key={feature} className="flex items-center">
                            <div className="mr-2">
                              {featureIcons[feature] || (
                                <lucide_react_1.CheckCircle
                                  className={"w-5 h-5 ".concat(
                                    plan.planId === "quantum"
                                      ? "text-[#00FF00]"
                                      : plan.planId === "professional"
                                        ? "text-[#FF0066]"
                                        : "text-[#00FFFF]",
                                  )}
                                />
                              )}
                            </div>
                            <span className="text-white">{feature}</span>
                          </div>
                        );
                      })}
                  </div>
                </card_1.CardContent>
                <card_1.CardFooter>
                  <button_1.Button
                    className={"w-full ".concat(
                      plan.planId === "quantum"
                        ? "bg-[#00FF00] hover:bg-[#00FF00]/80 text-black"
                        : plan.planId === "professional"
                          ? "bg-[#FF0066] hover:bg-[#FF0066]/80 text-white"
                          : "bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black",
                    )}
                    onClick={function () {
                      return handleSelectPlan(plan.planId);
                    }}
                  >
                    {plan.planId === "quantum"
                      ? "UNLEASH QUANTUM"
                      : "SELECT PLAN"}
                  </button_1.Button>
                </card_1.CardFooter>
              </card_1.Card>
            );
          })}
      </div>
    </div>
  );
}
