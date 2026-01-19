console.log("Debugging Voice route dependencies...");
try {
    console.log("Importing FlightSearchService...");
    const { flightSearchService } = await import('./services/flights/FlightSearchService');
    console.log("FlightSearchService ok.");

    console.log("Importing BDICore...");
    const { bdiCore } = await import('./services/intelligence/BDICore');
    console.log("BDICore ok.");

    console.log("Importing routes/voice...");
    await import('./routes/voice');
    console.log("routes/voice ok.");

} catch (e) {
    console.error("IMPORT ERROR:", e);
}
