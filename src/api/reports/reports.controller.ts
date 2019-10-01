import mongoose from 'mongoose'
import { validate, validateRangeBasedParameter, validateReportsSortParameter, isValidDate } from '../../utils/validator'
import errors from '../../utils/errors'
import Question from '../questions/question.model'
import Report, { IReport } from './report.model'
import * as statsCtrl from '../stats/stats.controller'
import { Request, Response } from 'express'

async function handleRangeBasedParameter(res: Response, queryObject: any, paramName: string, rawParam: string): Promise<boolean | void> {
  if (typeof rawParam === 'undefined') return true
  try {
    const [isValid, validParamObject] = await validateRangeBasedParameter(paramName, rawParam)
    if (!isValid) return errors.invalidParam(res, paramName, rawParam)
    queryObject[paramName] = validParamObject
    return true
  } catch (error) {
    return false
  }
}

const handleReportsQuery = (queryObject: any, reqQuery: any, res: Response): void => {
  // Handle mode parameter
  if (reqQuery.mode) {
    const lower = reqQuery.mode.toLowerCase()
    if (lower === 'tf') {
      queryObject.mode = 'TF'
    }
    else if (lower === 'mc') {
      queryObject.mode = 'MC'
    }
  }

  // Handle range based parameters. They start with =, < or > followed by a number or string.
  const rangeParams = ['score', 'numQuestions', 'percentage', 'grade']
  for (let i = 0; i < rangeParams.length; i++) {
    const paramName = rangeParams[i]
    if (!handleRangeBasedParameter(res, queryObject, paramName, reqQuery[paramName])) return
  }

  /**
   * @param {string} param - Either 'after' or 'before'.
   */
  const handleDate = (param: 'after' | 'before'): boolean => {
    if (isValidDate(reqQuery[param])) {
      if (!queryObject.createdAt) queryObject.createdAt = {}
      queryObject.createdAt[param === 'after' ? '$gt' : '$lt'] = reqQuery[param]
    }
    else if (typeof reqQuery[param] !== 'undefined') {
      errors.invalidDate(res, reqQuery[param])
      return false
    }

    return true
  }

  // Handle 'after' and 'before' parameters
  if (!handleDate('after') || !handleDate('before')) return

  // Generate query
  let query = Report.find(queryObject)

  // Sort
  const [isValid, sortObject] = validateReportsSortParameter(reqQuery.sort)
  if (isValid) query = query.sort(sortObject)

  // Limit reports
  if (reqQuery.limit && !isNaN(reqQuery.limit) && Number(reqQuery.limit) > 0) {
    query = query.limit(Number(reqQuery.limit))
  }

  // Execute query
  query.exec((err, reports) => {
    if (err) {
      errors.somethingWentWrong(res)
    }
    else {
      res.json(reports)
    }
  })
}

// Return all reports
export function getAllReports(req: Request, res: Response) {
  handleReportsQuery({}, req.query, res)
}

// Return reports for a given school
export async function getReportsForSchool(req: Request, res: Response) {
  const [isValid, validSchool] = await validate(req.params.school)
  if (!isValid) return errors.noSchoolFound(res, req.params.school)
  return handleReportsQuery({ 'exam.school': validSchool }, req.query, res)
}

// Return reports for a given course
export async function getReportsForCourse(req: Request, res: Response) {
  const [isValid, validSchool, validCourse] = await validate(req.params.school, req.params.course)
  if (!isValid) return errors.noCourseFound(res, req.params.school, req.params.course)
  return handleReportsQuery(
    {
      'exam.school': validSchool,
      'exam.course': validCourse,
    }, req.query, res)
}

// Return reports for a given exam
export async function getReportsForExam(req: Request, res: Response) {
  const [isValid, validSchool, validCourse, validExam] = await validate(req.params.school, req.params.course, req.params.exam)
  if (!isValid) {
    return errors.noExamFound(res, req.params.school, req.params.course, req.params.exam)
  }

  return handleReportsQuery(
    {
      'exam.school': validSchool,
      'exam.course': validCourse,
      'exam.name': validExam,
    }, req.query, res)
}

// Add a new report
export async function addReport(req: Request, res: Response): Promise<void> {
  const [isValid, validSchool, validCourse] = await validate(req.body.exam.school, req.body.exam.course)
  if (!isValid) {
    return errors.noExamFound(res, req.params.school, req.params.course, req.params.exam)
  }

  const rawReport: IReport = {
    exam: {
      school: validSchool,
      course: validCourse,
      name: req.body.exam.name,
    },
    createdAt: req.body.createdAt,
    history: req.body.history.map((q: any) => ({ ...q, questionId: mongoose.Types.ObjectId(q.questionId) })),
    score: req.body.score,
    numQuestions: req.body.numQuestions,
    percentage: req.body.percentage,
    grade: req.body.grade,
  }

  const report = new Report(rawReport)

  report.save((err, post) => {
    if (err) {
      res.status(500).send('Something went wrong.')
    }
    res.status(201).json(post)

    // Update stats based on this report
    statsCtrl.updateStats(report)
  })

  // Update each question with respective answer history
  rawReport.history.forEach((question) => {
    const { givenAnswer, wasCorrect } = question
    Question.findOneAndUpdate(
      { _id: question.questionId },
      {
        $push: { history: { givenAnswer, wasCorrect } },
        $inc: { 'stats.totalAnswers': 1, 'stats.totalCorrect': wasCorrect ? 1 : 0 },
      }).exec()
  })
}
