
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
// Bootstrap
app.use("/css", express.static("./node_modules/bootstrap/dist/css"));

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

// MOVIE ROUTES
//Added Filtering
app.get('/movies', (req, res) => {

    //Extract query params
    //const { director, genre, durationHours, durationMinutes, releaseDate } = req.query;
    const { title, director, genre, releaseDate } = req.query;
    
    //FIX DURATION FILTER
    //const duration = `0${durationHours}:${durationMinutes}:00`;

    db.getMovies({title, director, genre, releaseDate}, (err, movies) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }

        if (!movies) {
            console.error("Movies array is undefined.");
            return res.status(500).send("Movies data is undefined.");
        }

        res.render('movies', {title: "Movies", movies: movies});
    });

    // db.getMovies(null, (err, movies) => {
    //     if (err) {
    //         res.status(500).send("An error occurred: " + err);
    //     }
    //     res.render('movies', {title: "Movies", movies: movies});
    // });
})
app.get('/movies/add', (req, res) => {
    res.render('movie_add', {title: "Add Movie"});
});
app.post('/movies/add', (req, res) => {
    db.addCatalog(req.body.CatalogID, req.body.Title, req.body.Director, req.body.ReleaseDate, req.body.Genre, (err, result) => {
        if (err) {
            console.dir(err);
            res.status(500).send("An error occurred with Catalog: " + err);
        } else {
            console.log("Successful Catalog and Genre Add!");
            db.addMovie(req.body.CatalogID, req.body.Duration, (err, result) => {
                if (err) {
                    res.status(500).send("An error occurred with Movie: " + err);
                } else {
                    console.log("Successful Movie Add! - DONE");
                    // Redirects to the previous page
                    res.redirect('/movie/' + req.body.CatalogID);
                }
            });
        }
    });
});
app.get('/movie/:id', (req, res) => {
    db.addView(req.params.id, req.session.user.UserID);

    const catalogID = req.params.id;
    db.getMovies({catalogID}, (err, movie) => {
        if (err || movie.length == 0) {
            res.status(500).send("An error occurred: " + err);
        } else {
            res.render('movie', {title: movie[0].Title, movie: movie[0]});
        }
    });  
    
});
app.post('/movie/delete/:id', (req, res) => {
    db.deleteMovieOrShow(req.params.id, (err, result) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        } else {
            console.log("Successful Movie delete!");
        
            // Redirects to the previous page
            res.redirect('/movies');
        }
    });
});

app.post('/movie/update/:id', (req, res) => {
    db.updateMovie(req.params.id,req.body.Duration, (err, result) => {
        if (err) {
            res.status(500).send("An error occurred with movie update: " + err);
        } else {
            db.updateCatalog(req.params.id, req.body.Title, req.body.Director, req.body.ReleaseDate, req.body.Genre, (err, result) => {
                if (err) {
                    res.status(500).send("An error occurred with catalog update: " + err);
                } else {
                    console.log("Successful Movie update!");
                }
                
            })
        }
        // Redirects to the previous page
        res.redirect(req.headers.referer || '/movies');
    });
    
});
// SHOW ROUTES
//TRYING TO ADD FILTERING
app.get('/shows', (req, res) => {

    const {title, director, seasons, releaseDate, genre} = req.query;

    db.getShows({title, director, seasons, releaseDate, genre}, (err, shows) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }
        res.render('shows', {title: "Shows", shows: shows});
    });

    // db.getShows(null, (err, shows) => {
    //     if (err) {
    //         res.status(500).send("An error occurred: " + err);
    //     }
    //     res.render('shows', {title: "Shows", shows: shows});
    // });
})
app.get('/shows/add', (req, res) => {
    res.render('show_add', {title: "Add Show"});
});
app.post('/shows/add', (req, res) => {
    db.addCatalog(req.body.CatalogID, req.body.Title, req.body.Director, req.body.ReleaseDate, req.body.Genre, (err, result) => {
        if (err) {
            console.dir(err);
            res.status(500).send("An error occurred with Catalog: " + err);
        } else {
            console.log("Successful Catalog and Genre Add!");
            db.addShow(req.body.CatalogID, req.body.Seasons, req.body.Episodes, (err, result) => {
                if (err) {
                    res.status(500).send("An error occurred with Show: " + err);
                } else {
                    console.log("Successful Show Add! - DONE");
                    // Redirects to the previous page
                    res.redirect('/show/' + req.body.CatalogID);
                }
            });
        }
    });
});
app.get('/show/:id', (req, res) => {
    db.addView(req.params.id, req.session.user.UserID);
    const catalogID = req.params.id;
    db.getShows({catalogID}, (err, show) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        } else {
            res.render('show', {title: show[0].Title, show: show[0]});
        }
    });  
    
});
app.post('/show/delete/:id', (req, res) => {
    db.deleteMovieOrShow(req.params.id, (err, result) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        } else {
            console.log("Successful Show delete!");
        
            // Redirects to the previous page
            res.redirect('/shows');
        }
    });
});

app.post('/show/update/:id', (req, res) => {
    db.updateShow(req.params.id, req.body.Seasons, req.body.Episodes, (err, result) => {
        if (err) {
            res.status(500).send("An error occurred with show update: " + err);
        } else {
            db.updateCatalog(req.params.id, req.body.Title, req.body.Director, req.body.ReleaseDate, req.body.Genre, (err, result) => {
                if (err) {
                    res.status(500).send("An error occurred with catalog update: " + err);
                } else {
                    console.log("Successful SHOW update!");
                }
                
            })
        }
        // Redirects to the previous page
        res.redirect(req.headers.referer || '/movies');
    });
    
});

// Account and User management
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
app.post('/login', (req, res, next) => {
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

//ADD FOR MANAGING OF ACTORS
app.get('/actors', (req, res) => {

    //to filter by actors first name
    const {FName} = req.query;

    db.getActors({FName}, (err, actors) => {
        if (err) {
            res.status(500).send("An error occurred: " + err);
        }
        res.render('actors', {title: "Actors", actors: actors});
    }
    );
});


// Route to display form for adding a new actor
app.get('/actors/add', (req, res) => {
    res.render('add_actor', { title: "Add Actor" });
});

// Route to handle adding a new actor
app.post('/actors/add', (req, res) => {
    // Extract the data from the form
    const { FName, LName, CatalogID } = req.body;
    db.addActor({ FName, LName, CatalogID }, (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.redirect('/actors');
    });
});

// EDIT AN ACTOR
app.get('/actors/edit/:id', (req, res) => {
    // Get the actor ID from the URL
    const actorId = req.params.id;
    // Get the actor from the database
    db.getActorById(actorId, (err, actor) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        if (!actor) {
            return res.status(404).send("Actor not found");
        }
        res.render('edit_actor', {title: "Edit Actor", actor: actor});
    });
});

// EDIT AN ACTOR POST
app.post('/actors/edit/:id', (req, res) => {
    const actorId = req.params.id;
    //
    const updatedActor = {
        FName: req.body.FName,
        LName: req.body.LName,
        CatalogID: req.body.CatalogID
    };
    db.updateActor(actorId, updatedActor, (err) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.redirect('/actors');
    });
});

// DELETE AN ACTOR
app.post('/actors/delete/:id', (req, res) => {
    const ActorID = req.params.id;
    db.deleteActor(ActorID, (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.redirect('/actors');
    });
});

//GENRES AND MANAGING OF GENRES
app.get('/genres', (req, res) => {
    // Extract the query parameters
    const {GenreID, Description} = req.query;
    // Get the genres from the database
    db.getGenres({GenreID, Description}, (err, genres) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.render('genres', {title: "Genres", genres: genres});
    });
});

// Display the add genre form
app.get('/genres/add', (req, res) => {
    res.render('add_genre', { title: "Add Genre" });
});

// Handle the add genre form submission
app.post('/genres/add', (req, res) => {
    const newGenre = {
        Description: req.body.Description,
        CatalogID: req.body.CatalogID
    };
    db.addGenre(newGenre, (err) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.redirect('/genres');
    });
});

// Display the edit genre form
app.get('/genres/edit/:id', (req, res) => {
    const genreId = req.params.id;
    db.getGenreById(genreId, (err, genre) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        if (!genre) {
            return res.status(404).send("Genre not found");
        }
        res.render('edit_genre', { title: "Edit Genre", genre: genre });
    });
});

// Handle the edit genre form submission
app.post('/genres/edit/:id', (req, res) => {
    const genreId = req.params.id;
    const updatedGenre = {
        Description: req.body.Description,
        CatalogID: req.body.CatalogID
    };
    db.updateGenre(genreId, updatedGenre, (err) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.redirect('/genres');
    });
});

// Handle genre deletion
app.post('/genres/delete/:id', (req, res) => {
    const genreId = req.params.id;
    db.deleteGenre(genreId, (err) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err);
        }
        res.redirect('/genres');
    });
});

// app is serves locally on port 3000
app.listen(3000, () => {
  console.log(`App listening http://localhost:3000`)
})