const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { isEmail } = require('validator')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [5, 'The password should be minimum 5 characters']
    },
})

//ADD BCRYPT AND SALT TO USER PASSWORD
userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email })
    if (user) {
        const isAuthenticated = await bcrypt.compare
            (password, user.password)
        if (isAuthenticated) {
            return user
        }
        throw Error('incorrect password')
    } else {
        throw Error('incorrect email')
    }
}

const User = mongoose.model('user', userSchema)
module.exports = User;