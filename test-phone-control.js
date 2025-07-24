#!/usr/bin/env node

/**
 * Phone Control Test Script
 *
 * This script helps you test phone control functionality.
 * Make sure your server is running on localhost:3000
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000/api/trillion-dollar";

async function testPhoneControl() {
  console.log("🔍 Testing JASON Phone Control System...\n");

  try {
    // 1. Discover devices first
    console.log("1. Discovering devices...");
    const devicesResponse = await fetch(`${BASE_URL}/devices`);
    const devicesData = await devicesResponse.json();

    console.log(`Found ${devicesData.devices?.length || 0} devices:`);
    const phones =
      devicesData.devices?.filter(
        (d) => d.type === "smartphone" || d.type === "phone",
      ) || [];

    if (phones.length === 0) {
      console.log(
        "❌ No phones found! Make sure your phone is on the same network.",
      );
      console.log("\n📱 To enable phone control:");
      console.log("   • For Android: Enable USB Debugging and connect via ADB");
      console.log(
        "   • For iOS: Enable AirPlay and ensure device is discoverable",
      );
      console.log("   • Make sure your phone is on the same WiFi network");
      return;
    }

    phones.forEach((phone) => {
      console.log(
        `   📱 ${phone.name} (${phone.address}) - ${phone.platform || "unknown"}`,
      );
    });

    const testPhone = phones[0];
    console.log(`\n🎯 Testing with: ${testPhone.name} (${testPhone.id})\n`);

    // 2. Test notification
    console.log("2. Testing notification...");
    const notificationResponse = await fetch(
      `${BASE_URL}/phone/${testPhone.id}/notification`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "JASON AI Test",
          message: "Phone control is working! 🎉",
          priority: "high",
          vibrate: true,
        }),
      },
    );
    const notificationResult = await notificationResponse.json();
    console.log(
      `   ${notificationResult.success ? "✅" : "❌"} Notification: ${notificationResult.message}`,
    );

    // 3. Test app launch
    console.log("\n3. Testing app launch...");
    const appResponse = await fetch(`${BASE_URL}/phone/${testPhone.id}/app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: "com.spotify.music", // Try Spotify
        parameters: {},
      }),
    });
    const appResult = await appResponse.json();
    console.log(
      `   ${appResult.success ? "✅" : "❌"} App Launch: ${appResult.message}`,
    );

    // 4. Test media control
    console.log("\n4. Testing media control...");
    const mediaResponse = await fetch(
      `${BASE_URL}/phone/${testPhone.id}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pause",
        }),
      },
    );
    const mediaResult = await mediaResponse.json();
    console.log(
      `   ${mediaResult.success ? "✅" : "❌"} Media Control: ${mediaResult.message}`,
    );

    // 5. Test screen control
    console.log("\n5. Testing screen control...");
    const screenResponse = await fetch(
      `${BASE_URL}/phone/${testPhone.id}/screen`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wake",
        }),
      },
    );
    const screenResult = await screenResponse.json();
    console.log(
      `   ${screenResult.success ? "✅" : "❌"} Screen Control: ${screenResult.message}`,
    );

    // 6. Get device status
    console.log("\n6. Getting device status...");
    const statusResponse = await fetch(
      `${BASE_URL}/phone/${testPhone.id}/status`,
    );
    const statusResult = await statusResponse.json();

    if (statusResult.success && statusResult.device) {
      console.log("   ✅ Device Status:");
      console.log(`      📱 Platform: ${statusResult.device.platform}`);
      console.log(
        `      🔋 Battery: ${statusResult.device.batteryLevel || "Unknown"}%`,
      );
      console.log(
        `      🔒 Locked: ${statusResult.device.isLocked ? "Yes" : "No"}`,
      );
      console.log(
        `      📶 Signal: ${statusResult.device.signalStrength || "Unknown"}`,
      );
      console.log(
        `      🔗 Connected: ${statusResult.device.isConnected ? "Yes" : "No"}`,
      );
    } else {
      console.log(
        `   ❌ Status: ${statusResult.message || "Failed to get status"}`,
      );
    }

    console.log("\n🎉 Phone control test completed!");
    console.log("\n📋 Available Commands:");
    console.log("   • Send notifications");
    console.log("   • Launch apps");
    console.log("   • Control media playback");
    console.log("   • Screen control (wake, lock, capture, mirror)");
    console.log("   • Get device status");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   • Make sure JASON server is running (npm run dev)");
    console.log("   • Check that your phone is on the same network");
    console.log("   • For Android: Install ADB and enable USB debugging");
    console.log("   • For iOS: Enable AirPlay and device discovery");
  }
}

// Run the test
testPhoneControl();
