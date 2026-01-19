import { compilePlan } from './server/services/planner/HTNPlanner';

async function testTypo(input: string, expectedKeyword: string) {
    const plan = compilePlan(input);
    console.log(`\nInput: "${input}"`);

    // Check if we hit the right path by inspecting task names or structure
    const tasks = plan.tasks.map(t => t.name).join(' | ');
    console.log(`Planned Tasks: ${tasks}`);

    if (tasks.toLowerCase().includes(expectedKeyword.toLowerCase())) {
        console.log(`✅ MATCHED: Found "${expectedKeyword}" related tasks.`);
    } else {
        console.log(`❌ FAILED: Did not find "${expectedKeyword}" related tasks.`);
    }
}

async function runTests() {
    console.log('--- Testing JASON Typo Tolerance & Universal Domains ---');

    // 1. Itineraries (Typo: intinerary, holliday)
    await testTypo('Make an intinerary to Paris', 'itinerary');
    await testTypo('Plan a holliday to Japan', 'itinerary'); // 'holiday' triggers same travel logic which makes 'itinerary' tasks

    // 2. Homework (Typo: homwork)
    await testTypo('Do my homwork on physics', 'homework');

    // 3. Video Editing (Typo: vidoe, eddit)
    await testTypo('Edit this vidoe', 'video');

    // 4. CAD (Typo: desegn)
    await testTypo('Create a new desegn for a house', 'CAD');

    // 5. File Org (Typo: oraganise)
    await testTypo('Oraganise my files', 'organize'); // Assumes existing logic covers this or typo fixer maps it
}

runTests();
