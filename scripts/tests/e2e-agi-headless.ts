import { performance } from 'node:perf_hooks'
import JASONCoreAIEngine from '../../core/JASON-AGI/JASONCoreAIEngine'

async function run() {
  const config: any = {
    userId: 'e2e-user',
    deviceId: 'e2e-device',
    trustLevel: 'standard',
    permissions: { calendarAccess: true, emailAccess: false, financialAccess: false, documentAccess: false, webAccess: true, deviceControl: false },
    autonomyLevel: 'semi-autonomous',
    contextDepth: 'deep',
    learningMode: 'active',
    // Trust/permission defaults
    enableLevel1Permissions: true,
    enableLevel2Permissions: true,
    enableLevel3Permissions: false,
    enablePauseAndReview: false,
    enableTrustScoring: true,
    enableAutoApproval: true,
    autoApprovalThreshold: 0.5,
    permissionTimeout: 10000,
    maxPendingRequests: 10,
    enableAuditLogging: true,
    // Jason Eye
    enableFloatingWidget: false,
    enableActivityFeed: true,
    enableStatusIndicator: true,
    enableMinimization: true,
    enableGlobalHotkey: false,
    position: 'bottom-right',
    size: 'small',
    opacity: 0.6,
    updateInterval: 500,
    maxActivityEntries: 100,
    enableNotifications: false
  }

  const engine = new (JASONCoreAIEngine as any)(config)

  const logs: Array<{ event: string; data: any; at: number }> = []
  const log = (event: string, data: any) => logs.push({ event, data, at: Date.now() })
  ;(engine as any).on('initialized', d => log('initialized', d))
  ;(engine as any).on('systemReady', d => log('systemReady', d))
  ;(engine as any).on('taskPlanned', d => log('taskPlanned', d))
  ;(engine as any).on('actionExecuted', d => log('actionExecuted', d))
  ;(engine as any).on('actionFailed', d => log('actionFailed', d))
  ;(engine as any).on('statusUpdated', d => log('statusUpdated', d))

  await new Promise<void>((resolve) => {
    (engine as any).once('initialized', () => resolve())
  })
  const beforeMem = process.memoryUsage()
  const t0 = performance.now()
  const result = await (engine as any).executeAutonomousTask('Plan weekly focus tasks', { domain: 'planning' })
  const t1 = performance.now()
  const afterMem = process.memoryUsage()

  const perf = {
    durationMs: Math.round(t1 - t0),
    rssMB: Math.round((afterMem.rss - beforeMem.rss) / 1024 / 1024),
    heapUsedMB: Math.round((afterMem.heapUsed - beforeMem.heapUsed) / 1024 / 1024)
  }

  const blocked = await (engine as any).executeAutonomousTask('Purchase flight tickets for Monday morning', { domain: 'travel' }).catch(e => String(e))

  await (engine as any).shutdown()

  const report = { result, perf, blocked, logs }
  console.log(JSON.stringify(report, null, 2))
  try {
    const fs = await import('node:fs')
    fs.mkdirSync('reports', { recursive: true })
    fs.writeFileSync('reports/headless-e2e.json', JSON.stringify(report, null, 2))
  } catch {}
}

run().catch(e => { console.error(e); process.exit(1) })