'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
//
const routes = require('./routes.js');
const auth = require('./auth.js');


// ===================================================================
//

const app = express();


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
  secret: process.env.SESSION_SECRET,
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
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
