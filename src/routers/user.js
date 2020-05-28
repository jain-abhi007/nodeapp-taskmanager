const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const  { sendWelcomeEmail, sendCancelEmail } = require('../emails/accounts')

router.post('/users', async (req, res) => {
    const cur_user = new User(req.body)
    try{
        await cur_user.save()
        sendWelcomeEmail(cur_user.email, cur_user.name)
        const token = await cur_user.generateAuthToken()
        res.status(201).send({cur_user, token})
    } catch(err) {
        res.status(400).send(err)
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(err){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch(err){
        res.status(500).send(err)
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(err){
        res.status(500).send(err)
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'age', 'password', 'email']
    const updates = Object.keys(req.body)
    const isValid = updates.every((key) => allowedUpdates.includes(key))
    const _id = req.user._id
    if (!isValid) {
        return res.status(400).send({error: 'Invalid Updates !!'})
    }
    try{
        //const user = await User.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true})
        const user = req.user
        updates.forEach((updateKey) => user[updateKey] = req.body[updateKey])
        await user.save()
        res.send(user)
    } catch(err){
        res.status(500).send(err)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    const _id = req.user._id
    try{
        sendCancelEmail(req.user.email, req.user.name)
        await req.user.remove()
        res.status(204).send(req.user)
    } catch(err){
        res.status(500).send(err)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error('Please upload a image'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.status(204).send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(err){
        res.status(404).send("error")
    }
})
module.exports = router