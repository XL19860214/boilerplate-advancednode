const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github2');
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
  (accessToken, refreshToken, profile, done) => {
    // console.log(`profile`, profile); // DEBUG
    myDataBase.findOne({ username: `github|${profile.id}` }, (err, user) => {
      if (err || user) {
        return done(err, user);
      } else {
        myDataBase.insertOne({
          username: `github|${profile.id}`
        }, (err, doc) => {
          if (!err) {
            console.log(doc.ops[0].username + ' is successfully registered throught GitHub.')
            return done(null, doc.ops[0]);
          }
          return done(null, false);
        })
      }
    });
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
