console.log("Debugging BDICore...");
try {
    console.log("Importing BeliefStore...");
    const { beliefStore } = await import('./services/intelligence/BeliefStore');
    console.log("BeliefStore ok.");

    console.log("Importing IntentParser...");
    const { IntentParser } = await import('./services/intent/IntentParser');
    console.log("IntentParser ok.");

    console.log("Importing TaskOrchestrator...");
    const { taskOrchestrator } = await import('./services/orchestrator/TaskOrchestrator');
    console.log("TaskOrchestrator ok.");

    console.log("Importing BDICore...");
    const { bdiCore } = await import('./services/intelligence/BDICore');
    console.log("BDICore ok.");

} catch (e) {
    console.error("IMPORT ERROR:", e);
}
