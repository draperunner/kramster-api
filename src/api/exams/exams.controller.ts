import wilson from 'wilson-score'
import { Response, Request } from 'express'

import { validate, validateExamsSortParameter } from '../../utils/validator'
import helpers from '../../utils/helpers'
import errors from '../../utils/errors'
import { Question } from '../questions/question.model'

import Exam from './exam.model'

function getRandomQuestionsFromExams(exams: Array<any>, numberOfQuestions: number): Array<Question> {
  // Merge all questions from resulting exams to one array
  let questions: Array<Question> = []
  for (let i = 0; i < exams.length; i++) {
    questions = questions.concat(exams[i].questions)
  }

  const n = Math.min(questions.length, numberOfQuestions)

  // Randomly pick questions from questions array and put in random_questions array.
  const randomQuestions = []
  for (let j = 0; j < n; j++) {
    const randomIndex = Math.floor(Math.random() * questions.length)
    randomQuestions.push(questions[randomIndex])
    questions.splice(randomIndex, 1)
  }

  return randomQuestions
}

/**
 * Return the numberOfQuestions hardest questions from argument exams
 * @param  {Object[]} exams             Exams to fetch hardest questions from
 * @param  {Number} numberOfQuestions   Maximum number of questions to fetch.
 * @return {Object[]}                   The hardest questions from given exam
 */
function getHardestQuestionsFromExams(exams: Array<any>, numberOfQuestions: number): Array<Question> {
  // Merge all questions from resulting exams to one array
  let questions: Array<Question> = []
  for (let i = 0; i < exams.length; i++) {
    questions = questions.concat(exams[i].questions)
  }

  /**
   * Calculate difficulty. A score of 0 is the easiest. A score of 1 is the hardest.
   * @param  {Object} question A question object to calculate difficulty for
   * @return {Number}          The difficulty value
   */
  const calculateDifficulty = (question: Question): number => {
    if (!question.stats || !question.stats.totalAnswers) {
      return 0
    }
    return wilson(question.stats.totalAnswers - question.stats.totalCorrect, question.stats.totalAnswers)
  }

  // Sort by decreasing difficulty
  const sortedQuestions = questions.slice().sort((q1, q2) => calculateDifficulty(q2) - calculateDifficulty(q1))

  // Return the numberOfQuestions hardest questions
  return sortedQuestions.slice(0, numberOfQuestions)
}

/**
 * Handles query parameters for any Exams API endpoint. Validates parameters and executes query.
 *
 * @param {Object} queryObject - The selector object for MongoDB's find method.
 * @param {Object} reqQuery - The query parameters from the HTTP request.
 * @param {Object} res - The Express response object.
 */
async function handleExamsQuery(queryObject: any, reqQuery: any, res: Response): Promise<void> {
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

  // Generate query
  let query = Exam.find(queryObject)

  // Sort
  const [isValid, sortObject] = await validateExamsSortParameter(reqQuery.sort)
  if (isValid) query = query.sort(sortObject)

  // Limit exams (if not random=true)
  if (reqQuery.random !== 'true' && reqQuery.hardest !== 'true' && reqQuery.limit && Number(reqQuery.limit) > 0) {
    query = query.limit(Number(reqQuery.limit))
  }

  // Populate question objects
  query = query.populate('questions')

  // Execute query
  query.exec((err, exams) => {
    if (err) return errors.somethingWentWrong(res)

    if (reqQuery.random === 'true') {
      const numberOfQuestions = reqQuery.limit ? Number(reqQuery.limit) : 10
      const questions = getRandomQuestionsFromExams(exams, numberOfQuestions)
      helpers.handleShuffle([{ questions }], reqQuery.shuffle)
      res.json(questions)
    }
    else if (reqQuery.hardest === 'true') {
      const numberOfQuestions = reqQuery.limit ? Number(reqQuery.limit) : 10
      const questions = getHardestQuestionsFromExams(exams, numberOfQuestions)
      helpers.handleShuffle([{ questions }], reqQuery.shuffle)
      res.json(questions)
    }
    else {
      helpers.handleShuffle(exams, reqQuery.shuffle)
      res.json(exams)
    }

    return null
  })
}

/**
 * Returns all exams.
 */
export function getAllExams(req: Request, res: Response) {
  handleExamsQuery({}, req.query, res)
}

/**
 * Returns all exams for the given school.
 */
export async function getExamsBySchool(req: Request, res: Response) {
  const [isValid, validSchool] = await validate(req.params.school)
  if (!isValid) return errors.noSchoolFound(res, req.params.school)
  return handleExamsQuery({ school: validSchool }, req.query, res)
}

/**
 * Returns all exams for the given school and course.
 */
export async function getExamsByCourse(req: Request, res: Response) {
  const [isValid, validSchool, validCourse] = await validate(req.params.school, req.params.course)
  if (!isValid) return errors.noCourseFound(res, req.params.school, req.params.course)
  return handleExamsQuery({ school: validSchool, course: validCourse }, req.query, res)
}

/**
 * Returns specific exam for the given school and course and with given name.
 */
export async function getExam(req: Request, res: Response) {
  const { school, course, exam } = req.params
  const [isValid, validSchool, validCourse, validExam] = await validate(school, course, exam)

  if (!isValid) {
    return errors.noExamFound(res, school, course, exam)
  }

  return handleExamsQuery({
      school: validSchool,
      course: validCourse,
      name: validExam,
    }, req.query, res)
}
