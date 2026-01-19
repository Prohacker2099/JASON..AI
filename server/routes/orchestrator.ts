
import express from 'express'
import { taskOrchestrator } from '../services/orchestrator/TaskOrchestrator'
import { logger } from '../utils/logger'

const router = express.Router()

router.post('/enqueue', async (req, res) => {
    try {
        const body = req.body || {}
        const job = await taskOrchestrator.enqueue(body)
        res.status(202).json(job)
    } catch (error) {
        logger.error('Failed to enqueue job', { error })
        res.status(500).json({ error: 'internal_error' })
    }
})

router.get('/jobs', async (req, res) => {
    try {
        const jobs = taskOrchestrator.listJobs()
        res.json(jobs)
    } catch (error) {
        res.status(500).json({ error: 'internal_error' })
    }
})

router.get('/jobs/:id', async (req, res) => {
    try {
        const id = req.params.id
        const job = taskOrchestrator.getJob(id)

        if (!job) {
            return res.status(404).json({ error: 'job_not_found' })
        }
        res.json(job)
    } catch (error) {
        res.status(500).json({ error: 'internal_error' })
    }
})

router.post('/interact/:promptId', async (req, res) => {
    try {
        const promptId = req.params.promptId
        const response = req.body.response
        const ok = await taskOrchestrator.submitInteraction(promptId, response)
        if (!ok) {
            return res.status(404).json({ error: 'job_not_found_or_not_waiting' })
        }
        res.json({ ok: true })
    } catch (error) {
        logger.error('Failed to submit interaction', { error })
        res.status(500).json({ error: 'internal_error' })
    }
})

export default router
