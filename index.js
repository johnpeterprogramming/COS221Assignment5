
const express = require('express')
const app = express()
const db = require('./db_connection')
const bodyParser = require('body-parser');
var session = require('express-session')

// Ends db connection when server is shutdown with Ctl+C
process.on('exit', () => {
    db.destroy();
});

const expressLayouts = require('express-ejs-layouts');

// Asset files are stored in the public folder
app.use(express.static('public'));

// Using express-ejs-layouts to create a layout for the app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);

app.set('view engine', "ejs");
app.set('layout', './layouts/main');

// Session setup
app.set('trust proxy', 1)
app.use(session({
  secret: 'sdfjlksadj231472893HGJKDHS*(F',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
}))

// Middleware logic, runs before every route
app.use((req, res, next) => {
    // User can't go to any page except login if he's not logged in
    if (!req.session.user && req.path != '/login') {
        res.redirect('/login');
        return;
    }
    // User can't go to login unless he's already logged out 
    if (req.session.user && req.path == '/login') {
        return;
    }
    if (!req.session.user && req.path == '/logout') {
        return;
    }
    res.locals.user = req.session.user;
    next();
});


// ROUTES

app.get('/', (req, res) => {
    res.render('index', {title: "Home"});
});

app.get('/movies', (req, res) => {
    db.getMovies((err, movies) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }
        res.render('movies', {title: "Movies", movies: movies});
    });
})

app.get('/shows', (req, res) => {
    db.getShows((err, shows) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }
        console.log(shows.length);
        res.render('shows', {title: "Shows", shows: shows});
    });
})

app.get('/account', (req, res) => {
    res.render('account', {title: "Account"});
});
app.post('/account', (req, res) => {
    db.updateUser(req.session.user.UserID, req.body.email, req.body.password, (err, result) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }
        console.log("Successful update!");
        req.session.user.Email = req.body.email;
        req.session.user.Password = req.body.password;
        res.redirect('/account');
    });
});

app.get('/login', (req, res) => {
    res.render('login', {title: "Login"});
});
app.post('/login', (req, res) => {
    db.verifyUser(req.body.email, req.body.password, (err, user) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }
        if (user.length == 0) {
            res.status(401).send("Invalid email or password");
        } else {
            // CODE HERE GETS EXECUTES WHEN USER HAS SUCCESSFULLY LOGGED IN
            req.session.user = user[0]; // db always returns an array, so index 0 is used to find user
            req.session.save();
            res.redirect('/account');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.listen(3000, () => {
  console.log(`App listening http://localhost:3000`)
})