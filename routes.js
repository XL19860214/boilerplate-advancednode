const passport = require('passport');
const bcrypt = require('bcrypt');

const routes = (app, myDataBase) => {
  //
  app.route('/').get((req, res) => {
    // 
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

  app.route('/register')
     .post((req, res, next) => {
       if (!req.body.username) {
         res.redirect('/');
       }
       myDataBase.findOne({ username: req.body.username }, (err, user) => {
         if (err) {
           next(err);
         } else if (user) {
           res.redirect('/');
         } else {
           myDataBase.insertOne({
             username: req.body.username,
             password: bcrypt.hashSync(req.body.password, 12)
           }, (err, doc) => {
             if (err) {
               res.redirect('/');
             } else {
               console.log(doc.username + ' is successfully registered.')
               // The inserted document is held within
               // the ops property of the doc
               next(null, doc.ops[0]);
             }
           })
         }
       })
     },
       passport.authenticate('local', { failureRedirect: '/' }),
       (req, res) => {
         res.redirect('/profile');
       }
     );

  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

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
}

module.exports = routes;
