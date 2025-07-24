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
exports.default = SubscriptionManagement;
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var wouter_1 = require("wouter");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var use_toast_1 = require("@/hooks/use-toast");
var queryClient_1 = require("@/lib/queryClient");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
function SubscriptionManagement() {
  var _this = this;
  var toast = (0, use_toast_1.useToast)().toast;
  var queryClient = (0, react_query_1.useQueryClient)();
  var _a = (0, react_1.useState)(false),
    cancelDialogOpen = _a[0],
    setCancelDialogOpen = _a[1];
  // Demo user ID, in a real app this would come from authentication
  var userId = 1;
  // Fetch subscription status
  var _b = (0, react_query_1.useQuery)({
      queryKey: ["/api/subscription", userId],
      staleTime: 1000 * 60, // 1 minute
    }),
    subscription = _b.data,
    isLoading = _b.isLoading;
  // Cancel subscription mutation
  var cancelSubscription = (0, react_query_1.useMutation)({
    mutationFn: function () {
      return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, queryClient_1.apiRequest)(
                  "POST",
                  "/api/subscription/".concat(userId, "/cancel"),
                ),
              ];
            case 1:
              response = _a.sent();
              return [2 /*return*/, response.json()];
          }
        });
      });
    },
    onSuccess: function () {
      queryClient.invalidateQueries({
        queryKey: ["/api/subscription", userId],
      });
      toast({
        title: "Subscription Cancelled",
        description:
          "Your subscription has been cancelled and will end at the current billing period.",
      });
      setCancelDialogOpen(false);
    },
    onError: function (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Could not cancel subscription. Please try again.",
        variant: "destructive",
      });
      setCancelDialogOpen(false);
    },
  });
  // Format date helper
  var formatDate = function (timestamp) {
    if (!timestamp) return "N/A";
    var date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };
  // Get subscription status text and color
  var getStatusInfo = function (status) {
    switch (status) {
      case "active":
        return {
          text: "Active",
          color: "text-[#00FF00]",
          icon: <lucide_react_1.Shield className="w-5 h-5" />,
        };
      case "canceled":
        return {
          text: "Canceled",
          color: "text-[#FF3300]",
          icon: <lucide_react_1.AlertTriangle className="w-5 h-5" />,
        };
      case "past_due":
        return {
          text: "Past Due",
          color: "text-[#FF3300]",
          icon: <lucide_react_1.AlertTriangle className="w-5 h-5" />,
        };
      case "incomplete":
        return {
          text: "Incomplete",
          color: "text-[#FF0066]",
          icon: <lucide_react_1.AlertTriangle className="w-5 h-5" />,
        };
      default:
        return {
          text: "Not Subscribed",
          color: "text-gray-400",
          icon: <lucide_react_1.Star className="w-5 h-5" />,
        };
    }
  };
  if (isLoading) {
    return (
      <card_1.Card className="w-full bg-[#1A1A1A] border border-[#00FFFF]/50 text-white">
        <card_1.CardHeader>
          <card_1.CardTitle className="text-[#00FFFF]">
            Subscription Status
          </card_1.CardTitle>
          <card_1.CardDescription className="text-gray-400">
            Loading subscription details...
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-t-2 border-[#00FFFF] border-solid rounded-full"></div>
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  // If no subscription, show upgrade card
  if (!subscription || subscription.status === "no_subscription") {
    return (
      <card_1.Card className="w-full bg-[#1A1A1A] border border-[#FF0066]/50 text-white">
        <card_1.CardHeader>
          <card_1.CardTitle className="text-[#FF0066]">
            Upgrade Your Experience
          </card_1.CardTitle>
          <card_1.CardDescription className="text-gray-400">
            You're currently using the free version of JASON. Upgrade for
            premium features.
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <lucide_react_1.Shield className="w-5 h-5 text-[#FF0066]" />
              <span>Quantum-grade security</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.Star className="w-5 h-5 text-[#FF0066]" />
              <span>Unlimited device connections</span>
            </div>
            <div className="flex items-center space-x-2">
              <lucide_react_1.Calendar className="w-5 h-5 text-[#FF0066]" />
              <span>Advanced neural adaptation</span>
            </div>
          </div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button
            className="w-full bg-[#FF0066] hover:bg-[#FF0066]/80 text-white"
            asChild
          >
            <wouter_1.Link href="/subscription">Upgrade Now</wouter_1.Link>
          </button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    );
  }
  var statusInfo = getStatusInfo(subscription.status);
  return (
    <>
      <card_1.Card className="w-full bg-[#1A1A1A] border border-[#00FFFF]/50 text-white">
        <card_1.CardHeader>
          <div className="flex justify-between items-center">
            <card_1.CardTitle className="text-[#00FFFF]">
              Subscription Status
            </card_1.CardTitle>
            <div
              className={"flex items-center px-3 py-1 rounded-full bg-opacity-10 ".concat(
                statusInfo.color,
                " bg-current",
              )}
            >
              <span className={"mr-1 ".concat(statusInfo.color)}>
                {statusInfo.icon}
              </span>
              <span className={statusInfo.color}>{statusInfo.text}</span>
            </div>
          </div>
          <card_1.CardDescription className="text-gray-400">
            Manage your JASON subscription
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0D1117] p-3 rounded">
              <div className="text-sm text-gray-400">Plan</div>
              <div className="font-semibold text-[#00FFFF]">
                {subscription.tier || "Premium"}
              </div>
            </div>
            <div className="bg-[#0D1117] p-3 rounded">
              <div className="text-sm text-gray-400">Renewal Date</div>
              <div className="font-semibold text-white">
                {formatDate(subscription.current_period_end)}
              </div>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="p-4 bg-[#FF3300]/10 border border-[#FF3300] rounded">
              <div className="flex items-start">
                <lucide_react_1.AlertTriangle className="w-5 h-5 text-[#FF3300] mr-2 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#FF3300]">
                    Subscription Ending
                  </h4>
                  <p className="text-sm text-gray-300">
                    Your subscription has been cancelled and will end on{" "}
                    {formatDate(subscription.current_period_end)}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </card_1.CardContent>
        <card_1.CardFooter className="flex justify-between">
          <button_1.Button
            variant="outline"
            className="border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/10"
            asChild
          >
            <wouter_1.Link href="/subscription">Change Plan</wouter_1.Link>
          </button_1.Button>

          {!subscription.cancel_at_period_end &&
            subscription.status === "active" && (
              <button_1.Button
                variant="outline"
                className="border-[#FF3300] text-[#FF3300] hover:bg-[#FF3300]/10"
                onClick={function () {
                  return setCancelDialogOpen(true);
                }}
              >
                Cancel Subscription
              </button_1.Button>
            )}
        </card_1.CardFooter>
      </card_1.Card>

      {/* Cancel Confirmation Dialog */}
      <alert_dialog_1.AlertDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <alert_dialog_1.AlertDialogContent className="bg-[#1A1A1A] border border-[#FF3300] text-white">
          <alert_dialog_1.AlertDialogHeader>
            <alert_dialog_1.AlertDialogTitle className="text-[#FF3300]">
              Cancel Subscription?
            </alert_dialog_1.AlertDialogTitle>
            <alert_dialog_1.AlertDialogDescription className="text-gray-300">
              Are you sure you want to cancel your subscription? You will lose
              access to premium features at the end of your current billing
              period.
            </alert_dialog_1.AlertDialogDescription>
          </alert_dialog_1.AlertDialogHeader>
          <alert_dialog_1.AlertDialogFooter>
            <alert_dialog_1.AlertDialogCancel className="bg-transparent border border-gray-600 text-white hover:bg-[#0D1117]">
              Keep Subscription
            </alert_dialog_1.AlertDialogCancel>
            <alert_dialog_1.AlertDialogAction
              className="bg-[#FF3300] hover:bg-[#FF3300]/80 text-white"
              onClick={function (e) {
                e.preventDefault();
                cancelSubscription.mutate();
              }}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? "Cancelling..." : "Yes, Cancel"}
            </alert_dialog_1.AlertDialogAction>
          </alert_dialog_1.AlertDialogFooter>
        </alert_dialog_1.AlertDialogContent>
      </alert_dialog_1.AlertDialog>
    </>
  );
}
