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
    getActors(callback) {
        this.connection.query("SELECT * from actors", callback);
    }
    //getMovies(CatalogID, callback)
    getMovies(filters, callback) {
        // let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, m.Duration, g.Description as Genre from movies as m, catalog as c, genre as g where m.CatalogID = c.CatalogID AND c.CatalogID = g.CatalogID";
        let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, m.Duration, g.Description as Genre FROM movies AS m, catalog AS c, genre AS g WHERE m.CatalogID = c.CatalogID AND c.CatalogID = g.CatalogID";
       
        // Add filters if provided
        if(filters.title){
            sql += " AND c.Title LIKE '%" + filters.title + "%'";
        }
        if (filters.director) {
            sql += " AND c.Director LIKE '%" + filters.director + "%'";
        }
        if (filters.genre) {
            sql += " AND g.Description = '" + filters.genre + "'";
        }
        // if (filters.duration) {
        //     sql += " AND m.Duration = '" + filters.duration + "'";
        // }
        if (filters.releaseDate) {
            // Assuming releaseDate is in YYYY-MM-DD format
            sql += " AND c.ReleaseDate = '" + filters.releaseDate + "'";
        }
    
        this.connection.query(sql, callback);
        // if (CatalogID)
        //     sql += " AND c.CatalogID = " + CatalogID;
        // this.connection.query(sql, callback);
    }
    //getShows(CatalogID, callback)
    getShows(filters, callback) {
        let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, s.Seasons, s.Episodes FROM shows as s, catalog as c WHERE s.CatalogID = c.CatalogID";
        
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
        // if (CatalogID)
        //     sql += " AND c.CatalogID = " + CatalogID;
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