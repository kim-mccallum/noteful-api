const path = require('path')
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
     id: folder.id,
     name: xss(folder.name)
 })

foldersRouter  
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(
            req.app.get('db')
        )
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name } = req.body;
        const newFolder = { name }

        if(!name){
            return res.status(400).json({
                error: { message: 'Folder name is required.'}
            })
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl + `/${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })
foldersRouter
    .route(`/:folder_id`)
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if(!folder){
                    return res.status(404).json({
                        error: { message: `Folder doesn't exist`}
                    })
                }
                res.folder = folder //Save the folder for the next?
                next()
            })
            .catch()
    })
    .get((req, res, next) => {
        res.json({
            id: res.folder.id,
            name: xss(res.folder.name), //sanitize
        })
    })
    .delete((req, res, next) => {
        // res.status(204).end()
        FoldersService.deleteFolder(
            req.app.get('db'), req.params.folder_id
        )
            .then(() =>  {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body;
        const folderToUpdate = { name }

        if(!name){
            return res.status(400).json({
                error: { message: `Request body must contain the folder name`}
            })
        }

        FoldersService.updateFolder(
            req.app.get('db'), 
            req.params.folder_id, 
            folderToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter;