var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var morgan = require('morgan');
var bodyParser = require('body-parser');
var routes = require('./routes');

app.use(morgan('dev'));
app.use(bodyParser());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', routes.site.index);

app.get('/users', routes.users.list);
app.post('/users', routes.users.create);
app.get('/users/:id', routes.users.show);
app.post('/users/:id', routes.users.edit);
app.post('/users/:id/delete', routes.users.del);

app.post('/users/:id/follow', routes.users.follow);
app.post('/users/:id/unfollow', routes.users.unfollow);

app.listen(port);
console.log('The magic happens on port ' + port);