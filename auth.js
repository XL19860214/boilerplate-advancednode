const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github');
const bcrypt = require('bcrypt');

const auth = (app, myDataBase) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    (username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log('User ' + username + ' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (bcrypt.compareSync(password, user.password)) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://boilerplate-advancednode.xl19860214.repl.co/auth/github/callback'
  },
    (accessToken, refreshToken, profile, cb) => {
      // console.log(`profile`, profile); // DEBUG
      // LINK https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, returnNewDocument: true },
        (err, doc) => {
          // console.log(`myDataBase.findOneAndUpdate::doc`, doc); // DEBUG
          return cb(err, doc.value);
        }
      );
    }
  ));

  passport.serializeUser((user, done) => {
    // console.log(`passport.serializeUser::user`, user); // DEBUG
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });


}

module.exports = auth;
