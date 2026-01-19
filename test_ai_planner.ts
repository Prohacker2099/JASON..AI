
import { compilePlanUniversal } from './server/services/planner/HTNPlanner';

async function test() {
    console.log("Testing Universal AI Planning...");

    const goals = [
        "plan a 7 day itinerery to cambodia", // Typo in itinerary
        "help me with my projt math homework", // Typo in project
        "organize my files on the desktop",    // Rule-based task
        "build a nuclear fusion reactor in my backyard" // Extremly complex/unusual (should trigger AI decomposition)
    ];

    for (const goal of goals) {
        console.log(`\n--- GOAL: ${goal} ---`);
        const plan = await compilePlanUniversal(goal);
        console.log("Corrected Goal:", plan.goal);
        console.log("Tasks:");
        plan.tasks.forEach(t => console.log(`- [${t.id}] ${t.name}`));
    }
}

test().catch(console.error);
