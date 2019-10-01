import { Response } from "express"

const errorMessages = {
  noSchoolFound(res: Response, school: string) {
    res.status(404).send(`404: No school called "${school}".`)
  },

  noCourseFound(res: Response, school: string, course: string) {
    res.status(404).send(`404: No course called "${course}" at school "${school}".`)
  },

  noExamFound(res: Response, school: string, course: string, exam: string) {
    res.status(404).send(`404: No exam called "${exam}" for course "${
      course}" at school "${school}".`)
  },

  somethingWentWrong(res: Response) {
    res.status(500).send('500: Something went wrong.')
  },

  invalidDate(res: Response, date: string) {
    res.status(400).send(`400: The given date is not on valid ISO 8601 format: ${date}`)
  },

  invalidParam(res: Response, paramName: string, rawParam: string) {
    res.status(400).send(`400: Invalid parameter "${paramName}": ${rawParam}`)
  },
}

export default errorMessages
