const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
        trim : true
    },
    password: {
        type : String, 
        required: true,
        minlength: 7,
        validate(pass) {
            if (pass.toLowerCase().includes('password')){
                throw new Error('password cannot contain "password"')
            }
        },
        trim: true
    },
    email: {
        type: String,
        unique: true,
        reuired: true,
        trim: true,
        lowercase: true,
        validate(mail) {
            if( !validator.isEmail(mail)) {
                throw new Error("Email not valid")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age Must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.methods.generateAuthToken = async function () { //instance methods
    const user = this
    const token = jwt.sign({ _id: user.id.toString()}, process.env.JWT_SECRET, {expiresIn: '1 day'})

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.statics.findByCredentials = async (email, pass) => { //model methods
    const user = await User.findOne({ email })
    if(!user) 
    {
        throw new Error('Unable to Login')
    }
    const isMatch = await bcrypt.compare(pass, user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}


//Hash the plain text message before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

//delete the tasks whem user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})
const User = mongoose.model('user', userSchema)

module.exports = User