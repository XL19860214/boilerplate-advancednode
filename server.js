'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
//
const routes = require('./routes.js');
const auth = require('./auth.js');
//
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

// ===================================================================
//

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const onAuthorizeSuccess = (data, accept) => {
  console.log('successful connection to socket.io');

  accept(null, true);
}

const onAuthorizeFail = (data, message, error, accept) => {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);



let currentUsers = 0;


// ===================================================================
// Configuration

fccTesting(app); //For FCC testing purposes

app.set('view engine', 'pug');


// ===================================================================
// Middlewares

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  key: 'express.sid',
  secret: process.env.SESSION_SECRET,
  store: store,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// ===================================================================
// Routes

// -------------------------------------------------------------------
// Authentication

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  auth(app, myDataBase);
  routes(app, myDataBase);

  io.on('connection', socket => {
    console.log('A user has connected');
    currentUsers++;
    io.emit('user count', currentUsers);

    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });

    socket.on('chat message', data => {
      console.log(`socket.on('chat message')`, 'New chat message');
      console.log(`socket.on('chat message')::data`, data); // DEBUG
      io.emit('chat message', {
        name: socket.request.user.name,
        message: data.message
      });
    });

    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      currentUsers--;
      io.emit('user count', currentUsers);
    });
  });

  

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});


// ===================================================================
// 

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
