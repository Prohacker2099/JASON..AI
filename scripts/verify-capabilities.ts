
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyCapabilities() {
    console.log('--- JASON CORE CAPABILITY VERIFICATION ---');

    // 1. Check Server status
    try {
        const health = await axios.get(`${API_BASE}/health`);
        console.log('✅ Server is ONLINE');
    } catch (e) {
        console.error('❌ Server is OFFLINE. Please start it with "npm start"');
        return;
    }

    // 2. Check Brain status
    try {
        const brainHealth = await axios.get('http://localhost:8000/health');
        console.log('✅ Brain is ONLINE', brainHealth.data);
    } catch (e) {
        console.error('❌ Brain is OFFLINE. Please check logs.');
        return;
    }

    // 3. Enqueue a Universal Action Task
    console.log('\n--- TESTING SEE-PLAN-ACT LOOP ---');
    const goal = "Go to https://news.google.com, describe what you see, and then tell me the title of the top story.";

    try {
        console.log(`Enqueuing goal: "${goal}"`);
        const resp = await axios.post(`${API_BASE}/orchestrator/enqueue`, {
            goal,
            simulate: false,
            sandbox: {
                allowUI: true,
                allowApp: true,
                allowPowershell: true,
                allowProcess: true
            }
        });

        const jobId = resp.data.id;
        console.log(`✅ Job enqueued. ID: ${jobId}`);

        // 4. Monitor Job
        let status = 'queued';
        console.log('Monitoring job execution (this may take a minute as JASON opens the browser)...');

        for (let i = 0; i < 30; i++) {
            await wait(3000);
            const statusResp = await axios.get(`${API_BASE}/orchestrator/jobs/${jobId}`);
            const currentStatus = statusResp.data.status;

            if (currentStatus !== status) {
                console.log(`Status changed: ${status} -> ${currentStatus}`);
                status = currentStatus;
            }

            if (status === 'completed') {
                console.log('\n✅ JOB COMPLETED SUCCESSFULLY!');
                console.log('Result:', JSON.stringify(statusResp.data.result, null, 2));
                return;
            }

            if (status === 'failed') {
                console.error('\n❌ JOB FAILED');
                console.error('Error:', statusResp.data.error);
                return;
            }

            if (status === 'waiting_for_user') {
                console.log('⚠️ JASON is waiting for user confirmation.');
                // Auto-approve if it's a test? No, let's just log it.
            }
        }

        console.log('🕒 Verification timed out.');

    } catch (error) {
        console.error('❌ Verification failed during execution:', error instanceof Error ? error.message : error);
    }
}

verifyCapabilities();
