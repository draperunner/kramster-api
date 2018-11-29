import express from 'express'
import controller from './list.controller'
import apicache from 'apicache'

const cache = apicache.middleware
const router = express.Router()

router.use(cache('10 minutes'))

router.get('/schools', controller.getSchools)
router.get('/courses', controller.getCourses)
router.get('/courses/:school', controller.getCoursesAtSchool)
router.get('/exams', controller.getExams)
router.get('/exams/:school', controller.getExamsAtSchool)
router.get('/exams/:school/:course', controller.getExamsForCourseAtSchool)

module.exports = router
