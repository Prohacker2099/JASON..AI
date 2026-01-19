// Standalone verification for JASON Typo & Domain Logic

// --- THE CODE UNDER TEST (Copied from HTNPlanner.ts) ---

function levenshteinDistance(a: string, b: string): number {
    const m = a.length
    const n = b.length
    const d: number[][] = []

    for (let i = 0; i <= m; i++) d[i] = [i]
    for (let j = 0; j <= n; j++) d[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
        }
    }
    return d[m][n]
}

function correctTypos(input: string): string {
    const dictionary = [
        'itinerary', 'vacation', 'holiday', 'schedule', 'calendar', 'remember',
        'organize', 'files', 'cleanup', 'research', 'homework', 'summary',
        'video', 'edit', 'premiere', 'capcut', 'cad', 'design', 'blueprint', 'autocad'
    ]

    return input.split(/\s+/).map(token => {
        const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cleanToken.length < 3) return token // Skip short words

        // Find best match
        let bestMatch = token
        let minDist = Infinity

        for (const word of dictionary) {
            const dist = levenshteinDistance(cleanToken, word)
            // Threshold: 1 for short words (<=4), 2 for medium (<=7), 3 for long
            const threshold = word.length <= 4 ? 1 : (word.length <= 7 ? 2 : 3)

            if (dist <= threshold && dist < minDist) {
                minDist = dist
                bestMatch = word
            }
        }
        return bestMatch
    }).join(' ')
}

function simulatePlanning(goal: string) {
    const rawGoal = (goal || '').toLowerCase()
    const g = correctTypos(rawGoal)
    console.log(`\nInput: "${goal}" -> Fixed: "${g}"`)

    const tasks: string[] = []

    // Logic from HTNPlanner.ts
    const travelRegex = /(?:plan|book|make).*?(?:trip|holiday|vacation|itinerary).*?(?:to|in)\s+([a-zA-Z\s]+)/i

    if (g.match(travelRegex)) {
        tasks.push('TRAVEL_PLANNING')
    } else if (g.includes('homework') || g.includes('study') || g.includes('essay') || g.includes('research')) {
        tasks.push('HOMEWORK_RESEARCH')
    } else if (g.includes('video') && (g.includes('edit') || g.includes('cut') || g.includes('create'))) {
        tasks.push('VIDEO_EDITING')
    } else if (g.includes('cad') || g.includes('design') || g.includes('blueprint') || g.includes('autocad')) {
        tasks.push('CAD_DESIGN')
    } else if (g.includes('organize') || g.includes('cleanup') || g.includes('files') || g.includes('folder')) {
        tasks.push('FILE_ORG')
    } else {
        tasks.push('FALLBACK_LLM')
    }

    return tasks
}

// --- TEST RUNNER ---

function runTests() {
    const cases = [
        { input: 'Make an intinerary to Paris', expected: 'TRAVEL_PLANNING', keyword: 'itinerary' },
        { input: 'Plan a holliday to Japan', expected: 'TRAVEL_PLANNING', keyword: 'holiday' },
        { input: 'Do my homwork on physics', expected: 'HOMEWORK_RESEARCH', keyword: 'homework' },
        { input: 'Edit this vidoe', expected: 'VIDEO_EDITING', keyword: 'video' },
        { input: 'Create a new desegn for a house', expected: 'CAD_DESIGN', keyword: 'design' },
        { input: 'Oraganise my files', expected: 'FILE_ORG', keyword: 'organize' }
    ];

    let passed = 0;

    cases.forEach(c => {
        const result = simulatePlanning(c.input);
        if (result.includes(c.expected)) {
            console.log(`✅ PASS: "${c.input}" detected as ${c.expected}`);
            passed++;
        } else {
            console.log(`❌ FAIL: "${c.input}" -> got ${result.join(', ')} (Expected ${c.expected})`);
        }
    });

    if (passed === cases.length) {
        console.log('\nAll typo logic tests PASSED.');
        process.exit(0);
    } else {
        console.log(`\n${cases.length - passed} tests FAILED.`);
        process.exit(1);
    }
}

runTests();
