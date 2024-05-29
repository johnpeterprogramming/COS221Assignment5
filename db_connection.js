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

    getViewsByCatalogID(CatalogID, callback) {
        this.connection.query("SELECT COUNT(*) as Views FROM user_views WHERE CatalogID = ?", [CatalogID], callback);
    }

    //getMovies(CatalogID, callback)
    getMovies(filters, callback) {
        let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, c.PosterUrl, m.Duration, g.Description as Genre, uv.Views FROM catalog AS c JOIN movies AS m ON m.CatalogID = c.CatalogID JOIN genre AS g ON c.CatalogID = g.CatalogID LEFT JOIN (SELECT CatalogID, COUNT(*) as Views FROM user_views GROUP BY CatalogID) AS uv ON uv.CatalogID = c.CatalogID WHERE c.PosterUrl IS NOT NULL"
       
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

        sql += " ORDER BY uv.Views DESC"
    
        this.connection.query(sql, callback);
        // this.connection.query(sql, callback);
    }
    //getShows(CatalogID, callback)
    getShows(filters, callback) {
        let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, c.PosterUrl, s.Seasons, s.Episodes, g.Description as Genre, COALESCE(uv.Views, 0) as Views FROM catalog AS c JOIN shows AS s ON s.CatalogID = c.CatalogID JOIN genre AS g ON c.CatalogID = g.CatalogID LEFT JOIN (SELECT CatalogID, COUNT(*) as Views FROM user_views GROUP BY CatalogID) AS uv ON uv.CatalogID = c.CatalogID WHERE c.PosterUrl IS NOT NULL";        

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

        sql += " ORDER BY Views DESC";

        this.connection.query(sql, callback);
    }

    updateMovie(CatalogID, Duration, callback) {
        this.connection.query("UPDATE movies SET Duration = ? WHERE CatalogID = ?", [Duration, CatalogID], callback);
    }

    updateShow(CatalogID, Seasons, Episodes, callback) {
        this.connection.query("UPDATE shows SET Seasons = ?, Episodes = ? WHERE CatalogID = ?", [Seasons, Episodes, CatalogID], callback);
    }

    updateCatalog(CatalogID, Title, Director, ReleaseDate, Genre, callback) {
        this.connection.query("UPDATE catalog SET Title = ?, Director = ?, ReleaseDate = ? WHERE CatalogID = ?", [Title, Director, ReleaseDate, CatalogID], (err, res) => {
            if (err) {
                callback(err);
            } else {
                this.connection.query("UPDATE genre SET Description = ? WHERE CatalogID = ?", [Genre, CatalogID], callback);
            }
        });
        
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
    addView(CatalogID, UserID, callback) {
        this.connection.query("INSERT INTO user_views (CatalogID, UserID) VALUES (?, ?)", [CatalogID, UserID], callback);
    }
}




module.exports = new Database()