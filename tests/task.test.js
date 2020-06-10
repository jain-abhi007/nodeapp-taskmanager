const request = require('supertest')
const Task = require('../src/models/task')
const app = require('../src/app')
const { userOneId, userOne, userTwoId, userTwo, taskOne,  setupDatabase} = require('./fixtures/db')

beforeEach(setupDatabase)


test('Shoul create a new task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'from my test'
        })
        .expect(201)
    
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('Should fetch all tasks for user', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toEqual(2)
})

test('Test delete task security', async () => {
   await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(204)
    const task = Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})