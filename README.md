# Kramster API – LEGACY

⚠️ This is the old backend service for [Kramster](https://github.com/draperunner/kramster). Kramster is now using Firebase and Firestore all the way.

---

The server for kramster.it used to be part of the [Kramster](https://github.com/draperunner/kramster) repository, but now the frontend and backend have been split apart!

## Get Started

First, install dependencies from npm:

```
npm install
```

To fill the database, you need to have MongoDB installed and running locally. When you have that, fill the database with this command:

```
npm run populate-db
```

Now you are ready to run the server with

```
npm start
```

The server will run on port 8000, unless specified with the `PORT` environment variable.

This project uses `dotenv`, so you can create a file called `.env` in the root with your variables. Example:

```
# .env
DB_URL=mongodb://localhost:27017/kramster
PORT=9000
```
