
const { UniversalAppController } = require('./server/services/universal/UniversalAppController');
const { UniversalAutonomyLoop } = require('./server/services/universal/UniversalAutonomyLoop');
const { compilePlanUniversal } = require('./server/services/planner/HTNPlanner');

async function testUniversal() {
    console.log("🚀 Testing Universal Physical Autonomy...");

    const appController = new UniversalAppController();
    const autonomyLoop = new UniversalAutonomyLoop(appController);

    const goal = "Open OneNote and write 'JASON is real' on a new page.";

    console.log(`\n--- STEP 1: Planning for goal: "${goal}" ---`);
    const plan = await compilePlanUniversal(goal);
    console.log("Generated Plan:", JSON.stringify(plan.tasks, null, 2));

    if (plan.tasks.length > 0) {
        console.log("\n--- STEP 2: Executing Autonomy Loop ---");
        // We execute the goal via the loop
        const success = await autonomyLoop.executeGoal(goal);
        console.log(`\n--- RESULT: ${success ? 'SUCCESS' : 'FAILURE'} ---`);
    } else {
        console.error("Failed to generate plan.");
    }
}

testUniversal().catch(console.error);
