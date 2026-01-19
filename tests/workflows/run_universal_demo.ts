
import { UniversalAppController } from '../../server/services/universal/UniversalAppController'
import { UniversalAutonomyLoop } from '../../server/services/universal/UniversalAutonomyLoop'

async function runDemo() {
    console.log("🚀 Starting Universal Autonomy Demo")

    // 1. Initialize Controller
    const controller = new UniversalAppController()
    await controller.initialize()

    // 2. Initialize Loop
    const loop = new UniversalAutonomyLoop(controller)

    // 3. Define Goal
    const goal = "Open Notepad and type 'JASON Universal Agent is Online'"
    console.log(`🎯 Goal: "${goal}"`)

    // 4. Execute
    try {
        const success = await loop.executeGoal(goal)
        if (success) {
            console.log("✅ Goal Achievement Verified.")
        } else {
            console.error("❌ Goal Execution Failed.")
        }
    } catch (e) {
        console.error(`❌ Error during demo: ${e}`)
    }
}

runDemo().catch(console.error)
