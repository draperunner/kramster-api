import express from 'express'
import controller from './stats.controller'
import apicache from 'apicache'

const cache = apicache.middleware
const router = express.Router()

router.use(cache('5 minutes'))

router.get('/', controller.getStatsForAll)
router.get('/:school', controller.getStatsForSchool)
router.get('/:school/:course', controller.getStatsForCourse)
router.get('/:school/:course/all', controller.getStatsForAllMode)
router.get('/:school/:course/random', controller.getStatsForRandomMode)
router.get('/:school/:course/hardest', controller.getStatsForHardestMode)
router.get('/:school/:course/:exam', controller.getStatsForExam)

module.exports = router
