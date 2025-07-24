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
exports.default = SubscriptionForm;
var react_1 = require("react");
var react_stripe_js_1 = require("@stripe/react-stripe-js");
var button_1 = require("@/components/ui/button");
var use_toast_1 = require("@/hooks/use-toast");
var wouter_1 = require("wouter");
function SubscriptionForm() {
  var _this = this;
  var stripe = (0, react_stripe_js_1.useStripe)();
  var elements = (0, react_stripe_js_1.useElements)();
  var toast = (0, use_toast_1.useToast)().toast;
  var _a = (0, wouter_1.useLocation)(),
    setLocation = _a[1];
  var _b = (0, react_1.useState)(false),
    isLoading = _b[0],
    setIsLoading = _b[1];
  var handleSubmit = function (e) {
    return __awaiter(_this, void 0, void 0, function () {
      var error, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            e.preventDefault();
            if (!stripe || !elements) {
              // Stripe.js hasn't loaded yet
              return [2 /*return*/];
            }
            setIsLoading(true);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              stripe.confirmPayment({
                elements: elements,
                confirmParams: {
                  return_url: "".concat(
                    window.location.origin,
                    "/payment-success",
                  ),
                },
                redirect: "if_required",
              }),
            ];
          case 2:
            error = _a.sent().error;
            if (error) {
              // Show error to your customer
              toast({
                title: "Payment Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
              });
              console.error("Payment error:", error);
            } else {
              // Payment succeeded
              toast({
                title: "Subscription Activated",
                description:
                  "Your subscription has been successfully activated!",
              });
              // Redirect to success page
              setLocation("/payment-success");
            }
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            console.error("Error during payment confirmation:", err_1);
            toast({
              title: "Payment Error",
              description:
                "An unexpected error occurred during payment processing.",
              variant: "destructive",
            });
            return [3 /*break*/, 5];
          case 4:
            setIsLoading(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-[#0D1117] rounded-md">
        <react_stripe_js_1.PaymentElement />
      </div>

      <div className="text-sm text-gray-400">
        <p>• Your payment information is processed securely by Stripe.</p>
        <p>• JASON does not store your full card details.</p>
        <p>
          • Your subscription will automatically renew at the end of each
          billing period.
        </p>
      </div>

      <button_1.Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black font-semibold"
      >
        {isLoading ? (
          <span className="flex items-center">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white"></span>
            Processing...
          </span>
        ) : (
          "Confirm Subscription"
        )}
      </button_1.Button>
    </form>
  );
}
