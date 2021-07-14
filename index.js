const express = require('express')
const app = express();
const authRoutes = require('./routes/authRoute')
app.use(express.json())
app.use(authRoutes)
const http = require('http').createServer(app)
const mongoose = require('mongoose')
const socketio = require('socket.io')
const io = socketio(http)
const mongoDB = 'mongodb+srv://admin:password1234@sei.dnjry.mongodb.net/chat-database?retryWrites=true&w=majority'
const PORT = process.env.PORT || 5000
const Room = require('./models/Room')
const Message = require('./models/Message')

mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true, }
).then(() => {
    console.log('connected to mongoDB')
}).catch(err => {
    console.log(err)
})

const { addUser, getUser, removeUser } = require('./helper')

io.on('connection', (socket) => {
    Room.find().then(result => {
        socket.emit('output-rooms', result)

    })
    Message.find().then(result => {
        socket.emit('output-message', result)
    })

    socket.on('create-room', name => {

        const room = new Room({
            name
        })
        room.save().then(result => {
            io.emit('room-created', result)
        })
    })
    socket.on('join', ({ name, room_id, user_id }) => {
        const { error, user } = addUser({
            socket_id: socket.id,
            name,
            room_id,
            user_id
        })
        socket.join(room_id)

        if (error) {
            console.log('There was an error')
        } else {
            console.log('join user', user)
        }
    })
    socket.on('sendMessage', (message, room_id, callback) => {
        const user = getUser(socket.id)
        const msgToStore = {
            name: user.name,
            user_id: user.user_id,
            room_id,
            text: message
        }
        console.log('MSG--->', msgToStore)
        const msg = new Message(msgToStore)
        msg.save().then(result => {
            io.to(room_id).emit('message', result)
            callback()
        })

    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
    })
})

http.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
});