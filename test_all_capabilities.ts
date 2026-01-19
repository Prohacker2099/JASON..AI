
import fetch from 'node-fetch';

async function testAll() {
    console.log('--- JASON ULTIMATE CAPABILITY TEST ---');
    const goal = "Launch Notepad, type 'I AM JASON', then open Chrome and go to google.com";
    console.log(`Goal: ${goal}`);

    try {
        const res = await fetch('http://127.0.0.1:3001/api/ghost/generic-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: goal })
        });

        const data = await res.json();
        console.log('Task created:', data);

        if (data.taskId) {
            console.log(`Watching task ${data.taskId} status...`);
            const interval = setInterval(async () => {
                const statusRes = await fetch(`http://127.0.0.1:3001/api/ghost/task/${data.taskId}`);
                const statusData = await statusRes.json();

                if (statusData.task) {
                    console.log(`Status: ${statusData.task.status}, Logs: ${statusData.task.logs.length}`);
                    if (statusData.task.logs.length > 0) {
                        console.log('Latest log:', statusData.task.logs[statusData.task.logs.length - 1]);
                    }

                    if (statusData.task.status === 'completed') {
                        console.log('✅ TEST COMPLETED SUCCESSFULLY');
                        clearInterval(interval);
                    } else if (statusData.task.status === 'failed') {
                        console.log('❌ TEST FAILED');
                        clearInterval(interval);
                    } else if (statusData.task.status === 'waiting_for_user') {
                        console.log('⚠️ TASK WAITING FOR USER APPROVAL');
                        // In a real scenario, we'd approve it here
                    }
                }
            }, 3000);
        }
    } catch (e) {
        console.error('Test failed to start:', e);
    }
}

testAll();
