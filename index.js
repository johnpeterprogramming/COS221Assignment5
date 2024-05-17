
const express = require('express')
const app = express()
const db = require('./db_connection')

// Ends db connection when server is shutdown with Ctl+C
process.on('exit', () => {
    db.destroy();
});

const expressLayouts = require('express-ejs-layouts');

// Asset files are stored in the public folder
app.use(express.static('public'));

// Using express-ejs-layouts to create a layout for the app
app.use(expressLayouts);

app.set('view engine', "ejs");
app.set('layout', './layouts/main');



// ROUTES

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


app.listen(3000, () => {
  console.log(`App listening http://localhost:3000`)
})