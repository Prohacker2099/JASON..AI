-- Add energy monitoring tables

CREATE TABLE IF NOT EXISTS "EnergyDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "zigbeeId" TEXT,
    "zwaveNodeId" INTEGER,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "maxPower" REAL NOT NULL DEFAULT 0,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EnergyReading" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (hex(randomblob(16))),
    "deviceId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "powerWatts" REAL NOT NULL,
    "voltageVolts" REAL NOT NULL,
    "currentAmps" REAL NOT NULL,
    "energyKwh" REAL NOT NULL,
    "frequency" REAL NOT NULL DEFAULT 50,
    "powerFactor" REAL NOT NULL DEFAULT 1.0,
    "temperature" REAL,
    FOREIGN KEY ("deviceId") REFERENCES "EnergyDevice" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "EnergyBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "energyKwh" REAL NOT NULL,
    "peakDemandKw" REAL NOT NULL,
    "baseCharge" REAL NOT NULL,
    "peakCharge" REAL NOT NULL,
    "offPeakCharge" REAL NOT NULL,
    "demandCharge" REAL NOT NULL,
    "connectionFee" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("deviceId") REFERENCES "EnergyDevice" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "EnergyRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseRate" REAL NOT NULL,
    "peakRate" REAL,
    "offPeakRate" REAL,
    "peakHours" TEXT, -- JSON string
    "demandCharge" REAL,
    "connectionFee" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_energy_reading_device_timestamp" ON "EnergyReading" ("deviceId", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_energy_reading_timestamp" ON "EnergyReading" ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_energy_bill_device" ON "EnergyBill" ("deviceId");
CREATE INDEX IF NOT EXISTS "idx_energy_bill_period" ON "EnergyBill" ("periodStart", "periodEnd");

-- Insert default energy rate
INSERT OR IGNORE INTO "EnergyRate" (
    "id", "name", "baseRate", "peakRate", "offPeakRate", 
    "peakHours", "demandCharge", "connectionFee", "isActive"
) VALUES (
    'default_us', 'US Average Rate', 0.15, 0.22, 0.08,
    '[{"start":"16:00","end":"21:00"}]', 15.0, 12.5, true
);
