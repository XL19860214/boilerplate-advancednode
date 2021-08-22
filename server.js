'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');

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
app.use(passport.initialize());
app.use(passport.session());


// ===================================================================
// Routes

// -------------------------------------------------------------------
// Authentication

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  passport.use(new LocalStrategy(
    (username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  //
  app.route('/').get((req, res) => {
    // 
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true
    });
  });

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/profile');
});

// -------------------------------------------------------------------
// 

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

app.get('/profile', ensureAuthenticated, (req, res) => {
  res.render(process.cwd() + '/views/pug/profile', {
    username: req.user.username
  });
});


// ===================================================================
// 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
