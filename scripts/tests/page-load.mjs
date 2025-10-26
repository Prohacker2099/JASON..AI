import puppeteer from 'puppeteer'

const URL = process.env.URL || 'http://localhost:3000'

function extractMetrics() {
  const timing = performance.timing
  const fp = performance.getEntriesByName('first-paint')[0]?.startTime
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime
  const nav = performance.getEntriesByType('navigation')[0]
  return {
    url: location.href,
    ttfb: nav ? nav.responseStart : timing.responseStart - timing.requestStart,
    domContentLoaded: nav ? nav.domContentLoadedEventEnd : timing.domContentLoadedEventEnd - timing.navigationStart,
    load: nav ? nav.loadEventEnd : timing.loadEventEnd - timing.navigationStart,
    firstPaint: fp || null,
    firstContentfulPaint: fcp || null
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 768 })
  const start = Date.now()
  const resp = await page.goto(URL, { waitUntil: ['domcontentloaded','networkidle2'], timeout: 30000 })
  const navMs = Date.now() - start
  const status = resp?.status()
  const metrics = await page.evaluate(extractMetrics)
  const perf = await page.metrics()
  console.log(JSON.stringify({ status, navMs, metrics, perf }, null, 2))
  await browser.close()
}

main().catch(e => { console.error('page-load failed', e); process.exit(1) })
