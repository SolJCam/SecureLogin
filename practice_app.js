var express = require('express');
var fs = require('fs');
var Sequelize = require('sequelize');
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body` - https://github.com/expressjs/body-parser
var session = require("express-session")
var bcrypt = require('bcrypt');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: 'Superman', 
                 saveUninitialized: true,
                 resave: true}));

sequelize = new Sequelize('experiments', 'Sol', 'password', {
	host: 'localhost',
	dialect: 'postgres',

	pool: {
		max: 5,
		min: 0,
		idle: 1000
		},
})

User = sequelize.define('users', {
	userName: {
		type: Sequelize.STRING,
		field: "UserName"
	},
	passWord: {
		type: Sequelize.STRING,
		field: "PassWord"
	}
}, {
	freezeTableName: true
});



app.get('/', function (req, res){
	fs.readFile('views/index.html', 'utf8', function (err, content, response){
		res.send(content);
	});
});

app.post('/signup', function (req, res) {
		bcrypt.genSalt(10, function (err, salt) {
			bcrypt.hash(req.body.password, salt, function (err, hash){
				console.log(hash)
				User.sync().then(function(){
					return User.create({
						userName: req.body.username,
						passWord: hash
					});
				});
			});
		});
	res.redirect('/');
});

app.get('/login', function (req, resp) {
	// console.log(req.query.password)
	sequelize.query("SELECT * FROM Users", {type: sequelize.QueryTypes.SELECT}).then(function(User) {
		// console.log(User)
		var nuser = []
		for(var i=0;i<User.length;i++){
			if(User[i].UserName == req.query.username){
				bcrypt.compare(req.query.password, User[i].PassWord, function (err, res){
					if(res == true){
						req.session.lastPage = '/login';
						resp.redirect('/logged_in');
					}else{
						resp.redirect('/login_failed');
					}
				});
			}else {
				nuser.unshift(User[i]);
				if(nuser.length == User.length){
					resp.redirect('/login_failed');
				}
			}
		}
	});
});

app.get('/logged_in', function (req, res) {
	var text = {
		html: "<head><title>Yay, session works!</title></head><h1>Good work Sol!<h1><button><a href='/'>back</a></button>"
		}
	res.send(text.html);
});

app.get('/login_failed', function (req, res) {
	var text = {
		html: "<head><title>Yup ;)</title></head><h1>UH-OH, either your username or password doesn't match. Please press the back button and try again</h1><button><a href='/'>back</a></button>"
		}
	res.send(text.html);
});

app.get('/message', function (req,res) {
	if(req.session.lastPage == '/login'){ 
		var text =  {
			html: "<h1>Welcome to the secret message!<h1><p>If you're seeing this message that means you are sercurely logged in and you have a session running ;)</p><br><button><a href='/'>back</a></button><button><a href='/log_out'>log out</a></button>"
			}
		res.send(text.html);
	}else{
		var text = {
			html: "<h1>Sorry you're not logged in!<h1><p>Please return to the homepage and log in</p><br><button><a href='/'>back</a></button>"
			}
		res.send(text.html);
	}
})

app.get('/log_out', function (req, res) {
	req.session.destroy()
	res.redirect('/')
})

app.listen(3000, function (){
	console.log("App listening on port 3000")
});
