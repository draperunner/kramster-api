import Exam from './../api/exams/exam.model'
import helpers from './helpers'

const getCourseCode = courseName => courseName.split(' ')[0].toUpperCase()

async function validateSchool(school) {
  const lower = school.toLowerCase()
  try {
    const schoolNames = await Exam.distinct('school')
    const validFull = schoolNames.some(element => element.toLowerCase() === lower)

    if (validFull) {
      return [true, school]
    }

    // Check if param is valid abbreviation/code
    for (let i = 0; i < schoolNames.length; i++) {
      const abb = helpers.getSchoolAbbreviationFromFullName(schoolNames[i])
      if (abb && abb.toLowerCase() === lower) {
        return [true, schoolNames[i]]
      }
    }
    return [false]
  } catch (error) {
    return [false]
  }
}

async function validateCourse(school, course) {
  const [isValid, validSchool] = await validateSchool(school)

  if (!isValid) return false

  const lower = course.toLowerCase()

  try {
    const courseNames = await Exam.find({ school: validSchool }).distinct('course')

    // Check if course param is valid full name
    const validFull = courseNames.some(element => element.toLowerCase() === lower)

    if (validFull) {
      return [true, validSchool, course]
    }

    // Check if param is valid abbreviation/code
    for (let i = 0; i < courseNames.length; i++) {
      const code = getCourseCode(courseNames[i])
      if (code && code.toLowerCase() === lower) {
        return [true, validSchool, courseNames[i]]
      }
    }

    return [false]
  } catch (error) {
    return [false]
  }
}

async function validateExam(school, course, exam) {
  const [isValid, validSchool, validCourse] = await validateCourse(school, course)

  if (!isValid)  return [false]

  const lower = exam.toLowerCase()
  try {
    const examNames = await Exam.find({ school: validSchool, course: validCourse }).distinct('name')
    const validFull = examNames.some(element => element.toLowerCase() === lower)

    if (validFull) {
      return [true, validSchool, validCourse, exam]
    }

    return [false]
  } catch (error) {
    return [false]
  }
}

function validateSortParameter(validParams, sortParameter) {
  if (!sortParameter) {
    return [true, { _id: 1 }]
  }

  const sortObject = {}
  let isValid = true

  const sortItems = sortParameter.split(',')

  for (let i = 0; i < sortItems.length; i++) {
    if (validParams.indexOf(sortItems[i]) > -1) {
      sortObject[sortItems[i]] = 1
    }
    else if (sortItems[i][0] === '-' && validParams.indexOf(sortItems[i].substring(1)) > -1) {
      sortObject[sortItems[i].substring(1) === 'created' ? '_id' : sortItems[i].substring(1)] = -1
    }
    else {
      isValid = false
    }
  }

  return [isValid, sortObject]
}

export function validate(school, course, exam) {
  if (school && course && exam) {
    return validateExam(school, course, exam)
  }
  if (school && course) {
    return validateCourse(school, course)
  }
  if (school) {
    return validateSchool(school)
  }
}

export function validateExamsSortParameter(sortParameter) {
  const valids = ['created', 'school', 'course', 'name']
  return validateSortParameter(valids, sortParameter)
}

export function validateReportsSortParameter(sortParameter) {
  const val = ['created', 'school', 'course', 'name', 'score', 'numQuestions', 'percentage', 'grade']
  return validateSortParameter(val, sortParameter)
}

export function isValidDate(dateParameter) {
  return dateParameter && !isNaN(Date.parse(dateParameter))
}

export function validateRangeBasedParameter(paramName, param) {
  const objectToReturn = {}

  // Check for multiple values (an interval)
  const params = param.split(',')

  for (let i = 0; i < params.length; i++) {
    const p = params[i]
    const operator = (p[0] === '>' || p[0] === '<') ? p[0] : '='
    let paramValue = (operator === '=') ? p : p.substring(1)

    const isInvalidGrade = paramName === 'grade' && !helpers.isGrade(paramValue)
    const isInvalidNumber = paramName !== 'grade' && isNaN(paramValue)

    if (isInvalidGrade || isInvalidNumber) {
      return [false]
    }

    if (paramName === 'grade') paramValue = paramValue.toUpperCase()

    // If an exact value is given (no lead operator), only this is considered.
    if (operator === '=') {
      return [true, paramValue]
    }

    // If same operator appears multiple times, only first is considered.
    if (operator === '<' && !objectToReturn.$lt) objectToReturn.$lt = paramValue
    else if (operator === '>' && !objectToReturn.$gt) objectToReturn.$gt = paramValue
  }

  return [true, objectToReturn]
}
