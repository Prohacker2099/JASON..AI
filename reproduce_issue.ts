
import { compilePlan } from './server/services/planner/HTNPlanner';

async function test() {
    const goal = "MAKE A 14 DAY ITINERARY TO JAPAN";
    console.log(`Testing goal: "${goal}"`);
    try {
        const plan = await compilePlan(goal);
        console.log("Plan compiled successfully:");
        console.log(JSON.stringify(plan, null, 2));
    } catch (e) {
        console.error("Plan compilation failed:", e);
    }
}

test();
