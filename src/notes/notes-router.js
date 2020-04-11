const path = require('path');
const express = require('express')
const xss = require('xss')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    content: xss(note.content),
    modified: note.modified,
    folderid: note.folderid
  })

notesRouter  
  .route('/')
  .get((req, res, next) => {
      const knexInstance = req.app.get('db')
      NotesService.getAllNotes(knexInstance)
        .then(notes => {
            res.json(notes.map(serializeNote))
        })
        .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
      const { name, content, folderid } = req.body;
      const newNote = { name, content, folderid }

      for (const [key, value] of Object.entries(newNote)){
        if (value == null)
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body`}
            })
        }    

      NotesService.insertNote(
          req.app.get('db'), 
          newNote
      )
        .then(notes => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${notes.id}`))
                .json(serializeNote(notes))
        })
        .catch(next)
  })

notesRouter
  .route('/:id')
  .all((req, res, next) => {
      NotesService.getById(
          req.app.get('db'), 
          req.params.id
      )
        .then(note => {
            if(!note){
                return res.status(400).json({
                    error: { message: `Note doesn't exist`}
                })
            }
            res.note = note
            next()
        })
        .catch(next)
  })
  .get((req, res, next) => {
      res.json(serializeNote(res.note))
  })
  .delete((req, res, next) => {
      NotesService.deleteNote(
          req.app.get('db'), 
          req.params.id
      )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    //   What should I do with the date modified? Should it update?
      const { name, content, folderid, modified } = req.body;
      const noteToUpdate = { name, content, folderid };

      const numberOfValues = Object.entries(noteToUpdate).filter(Boolean).length
      if (numberOfValues === 0)
        return res.status(400).json({
            error: { message: `Request body must contain either 'text' or 'date_notesed'`}
        })
      NotesService.updateNote(
          req.app.get('db'),
          req.params.id,
          noteToUpdate
      )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
  })

module.exports = notesRouter;