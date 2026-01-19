
import { compilePlanUniversal } from './server/services/planner/HTNPlanner';
import { UniversalAppController } from './server/services/universal/UniversalAppController';
import { UniversalAutonomyLoop } from './server/services/universal/UniversalAutonomyLoop';

async function testPlannedGoal() {
    console.log("🚀 Testing Planned Goal (Travel Regex)...");

    const goal = "Plan a 10 days holiday to Cambodia luxury";
    console.log(`\n--- STEP 1: Planning for goal: "${goal}" ---`);
    const plan = await compilePlanUniversal(goal);

    console.log("Generated Plan Tasks:");
    plan.tasks.forEach(t => {
        console.log(`- [${t.id}] ${t.name} (Action: ${t.action?.type || 'none'})`);
    });

    if (plan.tasks.length > 0) {
        console.log("\n--- STEP 2: Executing Autonomy Loop (Simulation) ---");
        const appController = new UniversalAppController();
        const autonomyLoop = new UniversalAutonomyLoop(appController);

        // We'll just verify the plan for now to see if it matched correctly
        if (plan.tasks.some(t => t.name.includes("Cambodia"))) {
            console.log("✅ Success: Plan matched hardcoded travel rule.");
        } else {
            console.error("❌ Failure: Plan did not match hardcoded rule, fell back to LLM?");
        }
    }
}

testPlannedGoal().catch(console.error);
