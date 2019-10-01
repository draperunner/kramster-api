import express from 'express'
import * as controller from './reports.controller'

const router = express.Router()

router.get('/', controller.getAllReports)
router.get('/:school', controller.getReportsForSchool)
router.get('/:school/:course', controller.getReportsForCourse)
router.get('/:school/:course/:exam', controller.getReportsForExam)
router.post('/add', controller.addReport)

export default router
