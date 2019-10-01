import { validate } from '../../utils/validator'
import errors from '../../utils/errors'
import { IReport } from '../reports/report.model'
import Stats, { IStats } from './stats.model'
import { Response, Request } from 'express'
import { Document } from 'mongoose'

// Function for building stats from an array of reports
const buildStats = (err: any, stats: Document, res: Response): void => {
  if (err) {
    res.status(500).send('Something went wrong.')
    return
  }

  if (!stats) {
    res.json({
      totalScore: 0,
      numReports: 0,
      averageScore: 0,
      grades: {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        F: 0,
      },
    })
    return
  }

  const stat: IStats = stats.toObject()

  stat.grades = {
    A: stat.grades.A || 0,
    B: stat.grades.B || 0,
    C: stat.grades.C || 0,
    D: stat.grades.D || 0,
    E: stat.grades.E || 0,
    F: stat.grades.F || 0,
  }
  const averageScore = stat.numReports > 0 ? stat.totalScore / stat.numReports : 0
  res.json({
    ...stat,
    averageScore,
  })
}

const updateStatsByKey = (key: { school?: string, course?: string, name?: string }, report: IReport): void => {
  const query: any = {}

  Object.keys(key).forEach((k: 'school' | 'course' | 'name') => {
    query[`key.${k}`] = key[k]
  })

  if (key.name === 'random') {
    query['key.numQuestions'] = report.numQuestions
  }

  interface UpdateObject {
    $inc: {
      [prop: string]: number,
    },
    $set: {
      [prop: string]: any,
    },
  }

  const updateObject: UpdateObject = {
    $inc: {
      numReports: 1,
      totalScore: report.score,
    },
    $set: {
      lastUpdated: report.createdAt,
    },
  }
  updateObject.$inc[`grades.${report.grade}`] = 1

  const options = {
    upsert: true,
    new: true,
  }

  Stats.findOneAndUpdate(query, updateObject, options)
    .catch(err => console.error('error', err))
}

// This is called when a new Report is inserted
export function updateStats(report: IReport): void {
  updateStatsByKey({}, report)
  updateStatsByKey({ school: report.exam.school }, report)
  updateStatsByKey({ school: report.exam.school, course: report.exam.course }, report)
  updateStatsByKey({ school: report.exam.school, course: report.exam.course, name: report.exam.name }, report)
}

// Return aggregated statistics for all reports
export function getStatsForAll(req: Request, res: Response) {
  Stats.findOne({ $or: [{ key: {} }, { key: { $exists: false } }] }, (err, stats) => {
    buildStats(err, stats, res)
  })
}

// Return aggregated statistics for a given school
export async function getStatsForSchool(req: Request, res: Response) {
  const [isValid, validSchool] = await validate(req.params.school)
  if (!isValid) return errors.noSchoolFound(res, req.params.school)
  Stats.findOne({ 'key.school': validSchool }, (err, stats) => {
    buildStats(err, stats, res)
  })
  return null
}

// Return aggregated statistics for a given course
export async function getStatsForCourse(req: Request, res: Response) {
  const [isValid, validSchool, validCourse] = await validate(req.params.school, req.params.course)
  if (!isValid) return errors.noCourseFound(res, req.params.school, req.params.course)
  Stats.findOne({ 'key.school': validSchool, 'key.course': validCourse },
    (err, stats) => {
      buildStats(err, stats, res)
    },
  )
  return null
}

// Return aggregated statistics 'all' mode.
export async function getStatsForAllMode(req: Request, res: Response): Promise<void> {
  const [isValid, validSchool, validCourse] = await validate(req.params.school, req.params.course)
  if (!isValid) return errors.noCourseFound(res, req.params.school, req.params.course)
  if (typeof req.query.numQuestions !== 'undefined' && isNaN(req.query.numQuestions)) {
    return errors.invalidParam(res, 'numQuestions', req.query.numQuestions)
  }

  interface Query {
    'key.school': string,
    'key.course': string,
    'key.name': 'all',
    numQuestions?: number,
  }

  const query: Query = {
    'key.school': validSchool,
    'key.course': validCourse,
    'key.name': 'all',
  }

  if (req.query.numQuestions) {
    query.numQuestions = req.query.numQuestions
  }

  Stats.findOne(query, (err, reports) => {
      buildStats(err, reports, res)
    },
  )
}

async function getStatsForMode(mode: string, req: Request, res: Response): Promise<void> {
  const [isValid, validSchool, validCourse] = await validate(req.params.school, req.params.course)
  if (!isValid) return errors.noCourseFound(res, req.params.school, req.params.course)
  if (typeof req.query.numQuestions !== 'undefined' && isNaN(req.query.numQuestions)) {
    return errors.invalidParam(res, 'numQuestions', req.query.numQuestions)
  }

  interface Query {
    'key.school': string,
    'key.course': string,
    'key.name': string,
    'key.numQuestions'?: number,
  }

  const query: Query = {
    'key.school': validSchool,
    'key.course': validCourse,
    'key.name': mode,
  }

  if (req.query.numQuestions) {
    query['key.numQuestions'] = parseInt(req.query.numQuestions, 10)
  }

  Stats.findOne(query, (err, stats) => {
      buildStats(err, stats, res)
    },
  )
}

// Return aggregated statistics for 'random' mode
export function getStatsForRandomMode(req: Request, res: Response) {
  getStatsForMode('random', req, res)
}

// Return aggregated statistics for 'hardest' mode
export function getStatsForHardestMode(req: Request, res: Response) {
  getStatsForMode('hardest', req, res)
}

// Return aggregated statistics for a given exam
export async function getStatsForExam(req: Request, res: Response) {
  const [isValid, validSchool, validCourse, validExam] = await validate(req.params.school, req.params.course, req.params.exam)
  if (!isValid) {
    return errors.noExamFound(res, req.params.school, req.params.course, req.params.exam)
  }

  Stats.findOne(
    {
      'key.school': validSchool,
      'key.course': validCourse,
      'key.name': validExam,
    },
    (err, stats) => {
      buildStats(err, stats, res)
    },
  )
  return null
}
