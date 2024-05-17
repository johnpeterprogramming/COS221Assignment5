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
    getMovies(CatalogID, callback) {
        let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, m.Duration, g.Description as Genre from movies as m, catalog as c, genre as g where m.CatalogID = c.CatalogID AND c.CatalogID = g.CatalogID";
        if (CatalogID)
            sql += " AND c.CatalogID = " + CatalogID;
        this.connection.query(sql, callback);
    }
    updateCatalog(CatalogID, Title, Director, ReleaseDate, callback) {
        this.connection.query("UPDATE catalog SET Title = ?, Director = ?, ReleaseDate = ? WHERE CatalogID = ?", [Title, Director, ReleaseDate, CatalogID], callback);
    }
    getShows(CatalogID, callback) {
        let sql = "SELECT c.CatalogID, c.Title, c.Director, c.ReleaseDate, s.Seasons, s.Episodes FROM shows as s, catalog as c WHERE s.CatalogID = c.CatalogID";
        if (CatalogID)
            sql += " AND c.CatalogID = " + CatalogID;
        this.connection.query(sql, callback);
    }
    deleteMovie(CatalogID, callback) {
        this.connection.query("DELETE FROM movies WHERE CatalogID = ?", [CatalogID], callback);
    }
    deleteShow(CatalogID, callback) {
        this.connection.query("DELETE FROM shows WHERE CatalogID = ?", [CatalogID], callback);
    }
}




module.exports = new Database()