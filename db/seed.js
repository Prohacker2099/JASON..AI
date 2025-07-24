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
function seed() {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      try {
        // Seed system metrics
        // await db.insert(schema.systemMetrics).values([
        //   {
        //     metricId: "neural-engine",
        //     name: "NEURAL ENGINE",
        //     value: "97%",
        //     percentage: 97,
        //     color: "#00FFFF",
        //     description: "Last optimization: 4s ago"
        //   },
        //   {
        //     metricId: "quantum-shield",
        //     name: "QUANTUM SHIELD",
        //     value: "100%",
        //     percentage: 100,
        //     color: "#00FF00",
        //     description: "Threats blocked today: 237"
        //   },
        //   {
        //     metricId: "memory-matrix",
        //     name: "MEMORY MATRIX",
        //     value: "76%",
        //     percentage: 76,
        //     color: "#FF0066",
        //     description: "~90MB idle / ~300MB active"
        //   },
        //   {
        //     metricId: "response-time",
        //     name: "RESPONSE TIME",
        //     value: "28ms",
        //     percentage: 90,
        //     color: "#00FFFF",
        //     description: "Voice latency: < 30ms"
        //   }
        // ]).onConflictDoNothing();
        // console.log("System metrics seeded successfully");
        // // Seed devices
        // await db.insert(schema.devices).values([
        //   {
        //     deviceId: "smarthome-hub",
        //     name: "Smart Home Hub",
        //     type: "home",
        //     icon: "home-4-line",
        //     status: "Online",
        //     isActive: true,
        //     details: {
        //       ip: "192.168.1.120"
        //     },
        //     metrics: [
        //       { name: "Temperature", value: "72°F" },
        //       { name: "Security System", value: "Armed", color: "#00FF00" }
        //     ]
        //   },
        //   {
        //     deviceId: "smartphone",
        //     name: "Smartphone",
        //     type: "phone",
        //     icon: "smartphone-line",
        //     status: "Online",
        //     isActive: true,
        //     details: {
        //       battery: 87,
        //       location: "Home Office"
        //     },
        //     metrics: [
        //       { name: "Notifications", value: "12 Pending", color: "#00FFFF" },
        //       { name: "Location", value: "Home Office", color: "#00FF00" }
        //     ]
        //   },
        //   {
        //     deviceId: "drone-camera",
        //     name: "Drone Camera",
        //     type: "drone",
        //     icon: "drone-line",
        //     status: "Offline",
        //     isActive: false,
        //     details: {
        //       battery: 0,
        //       lastActive: "2 days ago",
        //       storage: "12.4GB / 64GB"
        //     },
        //     metrics: [
        //       { name: "Last Active", value: "2 days ago" },
        //       { name: "Storage", value: "12.4GB / 64GB" }
        //     ]
        //   }
        // ]).onConflictDoNothing();
        // console.log("Devices seeded successfully");
        // // Seed activities
        // await db.insert(schema.activities).values([
        //   {
        //     activityId: uuidv4(),
        //     title: "Security Alert",
        //     description: "Suspicious login attempt blocked from unknown IP",
        //     type: "security",
        //     timestamp: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
        //   },
        //   {
        //     activityId: uuidv4(),
        //     title: "Smart Home Action",
        //     description: "Temperature adjusted based on weather forecast",
        //     type: "home",
        //     timestamp: new Date(Date.now() - 17 * 60 * 1000) // 17 minutes ago
        //   },
        //   {
        //     activityId: uuidv4(),
        //     title: "Behavior Learning",
        //     description: "New preference pattern detected and saved",
        //     type: "learning",
        //     timestamp: new Date(Date.now() - 42 * 60 * 1000) // 42 minutes ago
        //   },
        //   {
        //     activityId: uuidv4(),
        //     title: "Device Warning",
        //     description: "Smartphone battery below 20%, charging mode activated",
        //     type: "warning",
        //     timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        //   }
        // ]);
        // console.log("Activities seeded successfully");
        // // Seed console messages
        // await db.insert(schema.consoleMessages).values([
        //   { messageId: uuidv4(), text: "JASON OS v1.0 initialized", type: "system", timestamp: new Date() },
        //   { messageId: uuidv4(), text: "Quantum Shield ACTIVE", type: "system", timestamp: new Date() },
        //   { messageId: uuidv4(), text: "Neural Engine ONLINE", type: "system", timestamp: new Date() },
        //   { messageId: uuidv4(), text: "Memory Matrix CALIBRATED", type: "system", timestamp: new Date() },
        //   { messageId: uuidv4(), text: "Universal Integration CONNECTED", type: "system", timestamp: new Date() },
        //   { messageId: uuidv4(), text: "Waiting for input...", type: "system", timestamp: new Date() }
        // ]);
        // console.log("Console messages seeded successfully");
        // // Seed subscription plans
        // await db.insert(schema.subscriptionPlans).values([
        //   {
        //     planId: 'basic',
        //     name: 'BASIC TIER',
        //     description: 'Essential control for your smart home devices',
        //     price: 999, // $9.99
        //     interval: 'month',
        //     features: JSON.stringify([
        //       'Control up to 5 devices',
        //       'Basic neural adaptation',
        //       'Email support',
        //       'Standard security layer'
        //     ]),
        //     isActive: true
        //   },
        //   {
        //     planId: 'professional',
        //     name: 'PROFESSIONAL TIER',
        //     description: 'Advanced controls and optimizations for power users',
        //     price: 1999, // $19.99
        //     interval: 'month',
        //     features: JSON.stringify([
        //       'Unlimited devices',
        //       'Advanced neural adaptation',
        //       'Priority support',
        //       'Enhanced security features',
        //       'Voice command customization',
        //       'Automation workflows'
        //     ]),
        //     isActive: true
        //   },
        //   {
        //     planId: 'quantum',
        //     name: 'QUANTUM TIER',
        //     description: 'The ultimate AI control system with full capabilities',
        //     price: 4999, // $49.99
        //     interval: 'month',
        //     features: JSON.stringify([
        //       'All Professional features',
        //       'Quantum-grade security',
        //       'Neural-adaptive self-optimization',
        //       'Full customization',
        //       '24/7 dedicated support',
        //       'Advanced analytics',
        //       'Multi-user access',
        //       'Future feature early access'
        //     ]),
        //     isActive: true
        //   }
        // ]).onConflictDoNothing();
        console.log("Subscription plans seeded successfully");
      } catch (error) {
        console.error("Error seeding database:", error);
      }
      return [2 /*return*/];
    });
  });
}
seed();
