
import fetch from 'node-fetch';

async function test() {
    const goal = "Open notepad on a hidden desktop and type 'JASON is truly autonomous now.'";
    console.log(`Sending goal to JASON: "${goal}"`);

    try {
        const res = await fetch('http://127.0.0.1:3001/api/ghost/generic-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: goal })
        });

        const data = await res.json();
        console.log('Task created:', data);

        if (data.taskId) {
            console.log('Watching task status...');
            const interval = setInterval(async () => {
                const statusRes = await fetch(`http://127.0.0.1:3001/api/ghost/task/${data.taskId}`);
                const statusData = await statusRes.json();
                console.log(`Status: ${statusData.task.status}, Logs: ${statusData.task.logs.length}`);

                if (statusData.task.status === 'completed' || statusData.task.status === 'failed') {
                    clearInterval(interval);
                    console.log('Final Logs:', statusData.task.logs.slice(-5));
                } else if (statusData.task.status === 'waiting_for_user') {
                    console.log('Task is waiting for user! This might be a permission prompt or interaction.');
                    // Auto-approve if it's a permission prompt?
                    // For now just log it.
                }
            }, 3000);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
