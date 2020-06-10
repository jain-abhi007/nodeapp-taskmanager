const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')


beforeEach(setupDatabase)

test('Should signup a new user', async () => {
    const response = await request(app)
    .post('/users')
    .send({
        name: 'Abhishek',
        email: 'abhishek.j06@gmail.com',
        password: 'abhis@1029'
    })
    .expect(201)

    const user = await User.findById(response.body.cur_user._id)
    expect(user).not.toBeNull()
    expect(response.body).toMatchObject({
        cur_user: {
            name: 'Abhishek',
            email: 'abhishek.j06@gmail.com', 
        },
        'token': user.tokens[0].token
    })
    expect(user.password).not.toBe('abhis@1029')
})

test('should login existing user', async () => {
    const response = await request(app)
    .post('/users/login')
    .send({
        email: userOne.email,
        password: userOne.password
    })
    .expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('should not login non-existing user', async () => {
    await request(app)
    .post('/users/login')
    .send({
        email: 'shouldfail@gmail.com',
        password: 'dummypassword'
    })
    .expect(400)
})

test('should get profile for user', async () => {
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('should not get profile for unauthorized user', async () => {
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('should delete authorized user', async () => {
    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(204)

    const user = await User.findById(userOneId)

    expect(user).toBeNull()
})

test('should not delete un-authorized user', async () => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('should upload avatar image', async () => {
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should patch a new user', async () => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name: 'Aj_jain'
    })
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user).not.toBeNull()
    expect(user.name).toBe('Aj_jain')
})

test('Should not patch a new user', async () => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name_field: 'Aj_jain'
    })
    .expect(400)

    const user = await User.findById(userOneId)
    expect(user).not.toBeNull()
    expect(user.name).toBe('Aj')
})