// eslint no-param-reassign: ["error", { "props": false }]
// eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]


'use strict';


const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const validator = require('validator');
var helpers = require('handlebars-helpers')(['regex', 'string']);

const app = express();
mongoose.connect(process.env.MONGO_URL);

const Users = require('./models/users.js');
const Tasks = require('./models/tasks.js');

// Configure our app
const store = new MongoDBStore({
    uri: process.env.MONGO_URL,
    collection: 'sessions',
});
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');

// For parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true,
}));

// Configure session middleware that will parse the cookies
// of an incoming request to see if there is a session for this cookie.
app.use(session({
    secret: process.env.SESSION_SECRET || 'super secret session',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: 'auto',
    },
    store,
}));

// Middleware that looks up the current user for this sesssion, if there
// is one.
app.use((req, res, next) => {
    if (req.session.userId) {
        Users.findById(req.session.userId, (err, user) => {
            if (!err) {
                res.locals.currentUser = user;
            }
            next();
        });
    } else {
        next();
    }
});


/**
 * Middleware that checks if a user is logged in.
 * If so, the request continues to be processed, otherwise a
 * 403 is returned.
 * @param  {Request} req - The request
 * @param  {Response} res - sdf
 * @param  {Function} next - sdfs
 * @returns {undefined}
 */
function isLoggedIn(req, res, next) {
    if (res.locals.currentUser) {
        next();
    } else {
        res.sendStatus(403);
    }
}

/**
 * Middleware that loads a users tasks if they are logged in.
 * @param  {Request} req - An express request object
 * @param  {Response} res - An express response object
 * @param  {Callback} next - Called when the function is done
 * @returns {undefined}
 */
function loadUserTasks(req, res, next) {
    // if(!res.locals.currentUser){
    //     res.redirect('/'),
    //     res.render("index");
    // }
    // Tasks.find({owner: res.locals.currentUser}, function(err,tasks){
    //     if(!err){
    //         res.locals.Tasks = Tasks;
    //     }
    //     next();
    // });
    next();
}

// Return the home page after loading tasks for users, or not.
app.get('/', loadUserTasks, (req, res) => {
    res.render('index');
});


// Handle submitted form for new users
app.post('/user/register', (req, res) => {
    var newUser = new Users();
    newUser.hashed_password = req.body.password;
    newUser.email = req.body.email;
    newUser.name = req.body.name
    newUser.save(function(err, user){
        if(user && !err){
	    	console.log('User resgistered. Logged in.\n');
	      	req.session.userId = user._id;
	      	res.redirect('/');
	      	return;
	    }
    	var errors = "Error registering you.";
	    if(err){
	      if(err.errmsg && err.errmsg.match(/duplicate/)){
	        errors = "Account with this email already exists!";
	      }
	      return res.render('index');
	    }
  		}
  	);
    //     console.log("added new user", user)
    //     if(err){
    //         res.send('there was an error saving the user');
    //     }
    //     else{
    //         res.redirect('/');
    //     }
    // })
    // res.send(req.body);
    // console.log('the user has the email address', req.body.email)
});

app.post('/user/login',  function(req, res) {
    Users.findOne({email: req.body.email}, function(err, user) {
        console.log(user);
        res.locals.currentUser = user;
        res.locals.userId = user._id;
		if(err || !user) {
			res.render('index', {errors: "Invalid email address"});
			return;
		}
		user.comparePassword(req.body.password, function(err, isMatch) {
			if(err || !isMatch){
				res.render('index', {errors: 'Invalid password'});
				console.log('\n\nInvalid password.\n\n');
				return;
	   		}
		   	else{
				req.session.userId = user._id;
				res.redirect('/');
				return;
		   	}

		});
	});
});

// Log a user out
app.get('/user/logout', (req, res) => {
        //req.session.destroy(function(){
          res.redirect('/user/login');
        });

//  All the controllers and routes below this require
//  the user to be logged in.
app.use(isLoggedIn);

// Handle submission of new task form
app.post('/tasks/:id/:action(complete|incomplete)', (req, res) => {
    res.send('woot');
});

app.post('/tasks/:id/delete', (req, res) => {
    res.send('woot');
});

// Handle submission of new task form
app.post('/task/create', function(req, res) {
    var newTask = new Tasks();

	newTask.owner = res.locals.currentUser._id;
	newTask.title = req.body.title;
	newTask.description = req.body.description;
	newTask.collaborator1 = req.body.collaborator1;
	newTask.collaborator2 = req.body.collaborator2;
	newTask.collaborator3 = req.body.collaborator3;
	newTask.isComplete = false;

	console.log("Creating task...\n");
	newTask.save(function(err, task) {
		if(err || !task) {
			console.log('Error saving task to the database.');
			res.render('index', { errors: 'Error saving task to the database.'} );
		}
		else {
			// console.log('New task added: ', task.title);
			res.redirect('/');
		}
	});


});

// Start the server
const port = process.env.PORT || 3500;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
