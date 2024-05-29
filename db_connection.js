const mysql = require('mysql')

class Database {
    constructor() {
        this.connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        })
        
        this.connection.connect(err => {
            if (err) throw err
            console.log('Database connected.')
        })
    }

    // Ends db connection when server is shutdown with Ctl+C
    destroy() {
        this.connection.end(err => {
            if (err) throw err
            console.log('Database connection closed.')
        })
    }

    // TODO
        // 1. Add ability to count views for a movie/show using user_views table

    // Returns account information if email and password match
    verifyUser(email, password, callback) {
        this.connection.query("SELECT a.AccountHolder, a.AccountNumber, a.CVV, a.SubscriptionType, a.SubscriptionStartDate, a.SubscriptionEndDate, u.UserID, u.Email FROM accounts AS a, user AS u WHERE a.UserID = u.UserID AND u.Email = '" + email + "' AND u.Password = '" + password + "'", callback);
    }
    updateUser(userid, email, password, callback) {
        this.connection.query("UPDATE user SET Email = ?, Password = ? WHERE UserID = ?", [email, password, userid], callback);
    }

    //Get actors and also by searching first name
    getActors(searchParam, callback) {
        //this.connection.query("SELECT * from actors", callback);
        let sql = "SELECT * FROM actors ";
        
        if (searchParam.FName) {
            sql += " WHERE FName LIKE '%" + searchParam.FName + "%'";
            
        }
        //Limit response to 150
        sql += " LIMIT 150";
        this.connection.query(sql, callback);
    }

    // Get actor by ID
    getActorById(actorId, callback) {
        this.connection.query("SELECT * FROM actors WHERE ActorID = ?", [actorId], (err, results) => {
            if (err) {
                return callback(err);
            }
            // Return only the first result
            callback(null, results[0]);
        });
    }
    //Add an actor
    addActor(actor, callback) {
        const sql = "INSERT INTO actors (FName, LName, CatalogID) VALUES (?, ?, ?)";
        this.connection.query(sql, [actor.FName, actor.LName, actor.CatalogID], callback);
    }
    
    //Update an actor
    updateActor(actorId, actorData, callback) {
        const { FName, LName, CatalogID } = actorData;
        this.connection.query("UPDATE actors SET FName = ?, LName = ?, CatalogID = ? WHERE ActorID = ?", [FName, LName, CatalogID, actorId], callback);
    }
    
    //Delete an actor
    deleteActor(actorId, callback) {
        this.connection.query("DELETE FROM actors WHERE ActorID = ?", [actorId], callback);
    }
    ///******************

    //GENRES
    // Get all genres
    getGenres(searchParam, callback) {
        //this.connection.query("SELECT * FROM genre", callback);
        let sql = "SELECT * FROM genre";
        // Add filters if provided
        if(searchParam.GenreID){
            sql += " WHERE GenreID = " + searchParam.GenreID;
        }
        if(searchParam.Description){
            sql += " WHERE Description LIKE '%" + searchParam.Description + "%'";
        }
        //Limit response to 200
        sql += " LIMIT 200";
        this.connection.query(sql, callback);

    }

    // Get genre by ID
    getGenreById(genreId, callback) {
        this.connection.query("SELECT * FROM genre WHERE GenreID = ?", [genreId], (err, results) => {
            if (err) {
                return callback(err);
            }
            // Return only the first result
            callback(null, results[0]);
        });
    }

    // Add a new genre
    addGenre(genreData, callback) {
        const { Description, CatalogID } = genreData;
        this.connection.query("INSERT INTO genre (Description, CatalogID) VALUES (?, ?)", [Description, CatalogID], callback);
    }

    // Update a genre
    updateGenre(genreId, genreData, callback) {
        const { Description, CatalogID } = genreData;
        this.connection.query("UPDATE genre SET Description = ?, CatalogID = ? WHERE GenreID = ?", [Description, CatalogID, genreId], callback);
    }

    // Delete a genre
    deleteGenre(genreId, callback) {
        this.connection.query("DELETE FROM genre WHERE GenreID = ?", [genreId], callback);
    }


    //getMovies(CatalogID, callback)
    getMovies(filters, callback) {
        // let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, m.Duration, g.Description as Genre from movies as m, catalog as c, genre as g where m.CatalogID = c.CatalogID AND c.CatalogID = g.CatalogID";
        let sql = "SELECT DISTINCT c.CatalogID, c.Title, c.Director, c.ReleaseDate, c.PosterUrl, m.Duration, g.Description as Genre FROM movies AS m, catalog AS c, genre AS g WHERE m.CatalogID = c.CatalogID AND c.CatalogID = g.CatalogID AND c.PosterUrl IS NOT NULL";
       
        // Add filters if provided
        if(filters.title){
            sql += " AND c.Title LIKE '%" + filters.title + "%'";
        }
        if (filters.director) {
            sql += " AND c.Director LIKE '%" + filters.director + "%'";
        }
        if (filters.genre) {
            sql += " AND g.Description  LIKE '%" + filters.genre + "%'";
        }
        // if (filters.duration) {
        //     sql += " AND m.Duration = '" + filters.duration + "'";
        // }
        if (filters.releaseDate) {
            // Assuming releaseDate is in YYYY-MM-DD format
            sql += " AND c.ReleaseDate = '" + filters.releaseDate + "'";
        }
        if (filters.catalogID)
            sql += " AND c.CatalogID = " + filters.catalogID;
    
        this.connection.query(sql, callback);
        // this.connection.query(sql, callback);
    }
    //getShows(CatalogID, callback)
    getShows(filters, callback) {
        let sql = "SELECT DISTINCT c.CatalogID, c.Title, c.Director, c.ReleaseDate, c.PosterUrl, s.Seasons, s.Episodes, g.Description as Genre FROM shows as s, catalog as c, genre as g WHERE s.CatalogID = c.CatalogID AND g.CatalogID = c.CatalogID AND c.PosterUrl IS NOT NULL";
        
        // Add filters if provided
        if(filters.title){
            sql += " AND c.Title LIKE '%" + filters.title + "%'";
        }
        if (filters.director) {
            sql += " AND c.Director LIKE '%" + filters.director + "%'";
        }
        if (filters.seasons) {
            sql += " AND s.Seasons = '" + filters.seasons + "'";
        }
        if(filters.releaseDate){
            sql += " AND c.ReleaseDate = '" + filters.releaseDate + "'";
        }
        if(filters.genre){
            sql += " AND g.Description LIKE '%" + filters.genre + "%'";
        }
        if (filters.catalogID)
            sql += " AND c.CatalogID = " + filters.catalogID;

        this.connection.query(sql, callback);
    }

    updateCatalog(CatalogID, Title, Director, ReleaseDate, callback) {
        this.connection.query("UPDATE catalog SET Title = ?, Director = ?, ReleaseDate = ? WHERE CatalogID = ?", [Title, Director, ReleaseDate, CatalogID], callback);
    }

    deleteMovieOrShow(CatalogID, callback) {
        this.connection.query("DELETE FROM catalog WHERE CatalogID = ?", [CatalogID], callback);
    }

    addCatalog(CatalogID, Title, Director, ReleaseDate, Genre, callback) {
        // I am starting a transaction, because there are several queries that could have errors and if the entire process isn't successful, I want to rollback the entire transaction
        this.connection.beginTransaction((transactionError) => {
            if (transactionError) {
                console.log("Error starting transaction");
                callback(transactionError);
            }
            this.connection.query("INSERT INTO catalog (CatalogID, Title, Director, ReleaseDate) VALUES (?, ?, ?, ?)", [CatalogID, Title, Director, ReleaseDate], (err, res) => {
                if (err) {
                    this.connection.rollback();
                    console.log("Error before adding genre");
                    callback(err);
                } else {
                    // Add Genre
                    this.connection.query("INSERT INTO genre (CatalogID, Description) VALUES (?, ?)", [CatalogID, Genre], (err, res) => {
                        if (err) {
                            this.connection.rollback();
                            callback(err, null);
                        } else {
                            this.connection.commit((commitFail) => {
                                if (commitFail) {
                                    this.connection.rollback();
                                    callback(commitFail);
                                } else
                                    callback(null, res);
                            });
                        }
    
                    });
                }
            });
        });
    }
    addMovie(CatalogID, Duration, callback) {
        this.connection.query("INSERT INTO movies (CatalogID, Duration) VALUES (?, ?)", [CatalogID, Duration], callback);
    }
    addShow(CatalogID, Seasons, Episodes, callback) {
        this.connection.query("INSERT INTO shows (CatalogID, Seasons, Episodes) VALUES (?, ?, ?)", [CatalogID, Seasons, Episodes], callback);
    }
}




module.exports = new Database()