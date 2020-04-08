const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures')

describe.only('Noteful Endpoints', function() {
    let db
    before('make knex instance', () => {
  
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      })
      app.set('db', db)
  
    })
  
    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE'))
    afterEach('cleanup',() => db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE'))
    
    describe(`GET /api/folders`, () => {
        //contexts and all the tests here
        context(`Given no folders`, () => {
            it(`responds with 200 and an empty list`, () => {
              return supertest(app)
                .get('/api/folders')
                .expect(200, [])
            })
        })

        context(`Given there are folders in the db`, () => {
          testFolders = makeFoldersArray();

          beforeEach('insert folders', () => {
            return db 
              .into('folders')
              .insert(testFolders)
          })

          it('responds with 200 and all of the folders', () => {
            return supertest(app)
              .get('/api/folders')
              .expect(200, testFolders)
          })
      })

    // describe(`GET /api/notes`, () => {
    //     //context and all the tests here
    // })
  })
})