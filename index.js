const cors = require("cors");
require("dotenv").config();
const express = require("express");

const app = express();
const Note = require("./models/note");

app.use(express.static("dist"));

const requestLogger = (req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Body", req.body);
  console.log("---");

  next();
};

const errorHandler = (error, request, response, next) => {
  console.log(error.name);
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }
  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ errror: "unknown endpoint" });
};

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/info", (request, response) => {
  const date = new Date().toUTCString;
  const maxNotes = Note.length;
  const info = `Notes has info for ${maxNotes} notes <br/> ${date}`;
  response.send(info);
});

app.get("/api/notes", (req, res) => {
  Note.find({})
    .then((notes) => {
      if (notes.length > 0) {
        res.status(201).json(notes);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).end();
    });
});

app.post("/api/notes", (request, response, next) => {
  const { body } = request;

  if (body.content === undefined) {
    return response.status(400).json({ error: "content missing" });
  }

  const note = new Note({
    content: body.content,
    important: Boolean(body.important) || false,
  });

  if (body.content) {
    note
      .save()
      .then((savedNote) => {
        response.status(201).json(savedNote);
      })
      .catch((error) => next(error));
  } else {
    response.status(404).json({ error: "note is required" });
  }
});

app.get("/api/notes/:id", (request, response) => {
  Note.findById(request.params.id)
    .then((note) => {
      if (note) {
        response.json(note);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => {
      console.log(error);
      response.status(500).end();
    });
});

app.delete("/api/notes/:id", (req, res, next) => {
  Note.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => {
      next(error);
    });
});

app.put("/api/notes/:id", (req, res) => {
  const { content, important } = req.body;

  Note.findByIdAndUpdate(
    req.params.id,
    { content, important },
    { new: true, runValidators: true, context: "query" }
  )
    .then((updatedNote) => {
      res.json(updatedNote);
    })
    .catch((error) => next(error));
});

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT);
console.log(`Server running on port ${PORT}`);
