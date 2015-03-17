var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var morgan = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var routes = require('./routes');

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// required for passport
app.use(session({ secret: 'yoursecret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./routes/routes.js')(app, passport);

/*app.get('/', routes.site.index);

app.get('/users', routes.users.list);
app.post('/users', routes.users.create);
app.get('/users/:id', routes.users.show);
app.post('/users/:id', routes.users.edit);
app.post('/users/:id/delete', routes.users.del);

app.post('/users/:id/follow', routes.users.follow);
app.post('/users/:id/unfollow', routes.users.unfollow);*/

app.listen(port);
console.log('The magic happens on port ' + port);