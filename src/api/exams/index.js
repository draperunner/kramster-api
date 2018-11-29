import express from 'express'
import * as controller from './exams.controller'

const router = express.Router()

router.get('/', controller.getAllExams)
router.get('/:school', controller.getExamsBySchool)
router.get('/:school/:course', controller.getExamsByCourse)
router.get('/:school/:course/:exam', controller.getExam)

export default router
