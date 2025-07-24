import { db } from "./index.js";
import * as schema from "@shared/schema.js";
import { v4 as uuidv4 } from "uuid";

async function seed() {
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
}

seed();
