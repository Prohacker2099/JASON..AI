
import { UniversalGhostHand } from './server/services/automation/UniversalGhostHand';
import { permissionManager } from './server/services/trust/PermissionManager';
import fetch from 'node-fetch';

const mockConfig = {
    workspace: 'C:\\Users\\supro\\Downloads\\JASON_TheOmnipotentAIArchitect\\jason_test_suite',
    headless: true,
    enableScreenshots: true,
    security: {
        allowExternalCommands: true,
        allowFileAccess: true,
        allowNetworkAccess: true,
        allowedDomains: ['*'],
        blockedDomains: []
    }
};

async function checkBrainHealth() {
    try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
            const data = await res.json() as any;
            console.log('✅ Brain Health:', data);
            return true;
        }
    } catch (e) { }
    return false;
}

async function runPromptTest(ghost: UniversalGhostHand, prompt: string) {
    console.log(`\n--- Testing Prompt: "${prompt}" ---`);
    try {
        const taskId = await ghost.executeGenericTask(prompt);
        console.log(`Task Created: ${taskId}`);

        // Poll for status
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 15) {
            await new Promise(r => setTimeout(r, 2000));
            const task = (await ghost.getAllTasks()).find(t => t.id === taskId);
            if (task) {
                console.log(`  [${attempts}] Status: ${task.status} (${task.progress}%)`);
                if (task.status === 'completed' || task.status === 'failed') {
                    completed = true;
                    console.log(`  Final Logs:\n    ${task.logs.slice(-3).join('\n    ')}`);
                    if (task.errors.length > 0) console.error('  Errors:', task.errors);
                }
            }
            attempts++;
        }
    } catch (err: any) {
        console.error(`❌ Prompt "${prompt}" failed:`, err.message);
    }
}

async function runSuite() {
    console.log('Starting Comprehensive JASON v2.0 Test Suite...');

    if (!await checkBrainHealth()) {
        console.warn('⚠️  Brain not available. Waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));
        if (!await checkBrainHealth()) {
            console.error('❌ Brain still offline. Tests will use fallback logic.');
        }
    }

    const ghost = new UniversalGhostHand(mockConfig as any);
    await ghost.initialize();

    // Auto-approve all permissions for the test
    permissionManager.on('prompt', (prompt) => {
        console.log(`  [TEST] Auto-approving: ${prompt.title}`);
        permissionManager.decide(prompt.id, 'approve');
    });

    const prompts = [
        "Open Calculator",
        "List files in the current directory",
        "Go to https://example.com and tell me the title"
    ];

    for (const p of prompts) {
        await runPromptTest(ghost, p);
    }

    console.log('\n--- Test Suite Finished ---');
    process.exit(0);
}

runSuite();
