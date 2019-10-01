import { validate } from '../../utils/validator'
import errors from '../../utils/errors'
import helpers from '../../utils/helpers'
import Exam from '../exams/exam.model'
import { Request, Response } from 'express'

// type is either "schools" or "courses", names is the list of full names
const handleShortParameter = (type: 'schools' | 'courses', names: Array<string>): Array<string> => {
  if (type !== 'schools' && type !== 'courses') return names

  const shorts = []
  const func = type === 'schools'
    ? helpers.getSchoolAbbreviationFromFullName
    : helpers.getCourseCodeFromFullName

  for (let i = 0; i < names.length; i++) {
    shorts.push(func(names[i]))
  }

  return shorts
}

/**
 * Checks the 'sort' parameter and returns the appropriate sorting function for Array.prototype.sort
 *
 * @param {string} sortParam
 * @return {function} sortFunction
 */
const getSortFunction = (sortParam: string) => {
  if (sortParam === '-alphabetically') return helpers.descSort
  return helpers.ascSort
}

// Return list of all distinct schools
export function getSchools(req: Request, res: Response) {
  Exam.distinct('school', (err, names) => {
    if (err) {
      res.status(500).send('Something went wrong.')
      return
    }

    const resultNames = req.query.short === 'true' ? handleShortParameter('schools', names) : names
    resultNames.sort(getSortFunction(req.query.sort))
    res.json(resultNames)
  })
}

// Return list of all distinct courses
export function getCourses(req: Request, res: Response) {
  Exam.distinct('course', (err, names) => {
    if (err) {
      res.status(500).send('Something went wrong.')
      return
    }

    const resultNames = req.query.short === 'true' ? handleShortParameter('courses', names) : names
    resultNames.sort(getSortFunction(req.query.sort))
    res.json(resultNames)
  })
}

// Return list of all courses at a given school
export async function getCoursesAtSchool(req: Request, res: Response) {
  const [isValid, validSchool] = await validate(req.params.school)
  if (!isValid) {
    errors.noSchoolFound(res, req.query.school)
    return
  }
  try {
    const names = await Exam.find({ school: validSchool }).distinct('course')
    const resultNames = req.query.short === 'true' ? handleShortParameter('courses', names) : names
    resultNames.sort(getSortFunction(req.query.sort))
    res.json(resultNames)
  } catch (error) {
    errors.somethingWentWrong(res)
  }
}

// Return list of all distinct exams
export async function getExams(req: Request, res: Response) {
  try {
    const names = await Exam.distinct('name')
    names.sort(getSortFunction(req.query.sort))
    res.json(names)
  } catch (error) {
    res.status(500).send('Something went wrong.')
  }
}

// Return list of all exams at a given school
export async function getExamsAtSchool(req: Request, res: Response) {
  const [isValid, validSchool] = await validate(req.params.school)
  if (!isValid) {
    errors.noSchoolFound(res, req.params.school)
    return
  }
  try {
    const names = await Exam.find({ school: validSchool }).distinct('name')
    return res.json(names.sort(getSortFunction(req.query.sort)))
  } catch (error) {
    return errors.somethingWentWrong(res)
  }
}

// Return list of all exams at a given school and course
export async function getExamsForCourseAtSchool(req: Request, res: Response) {
  const [isValid, validSchool, validCourse] = await validate(req.params.school, req.params.course)
  if (!isValid) {
    errors.noCourseFound(res, req.params.school, req.params.course)
    return
  }
  try {
    const names = await Exam.find({ school: validSchool, course: validCourse }).distinct('name')
    names.sort(getSortFunction(req.query.sort))
    return res.json(names)
  } catch (error) {
    return errors.somethingWentWrong(res)
  }
}
