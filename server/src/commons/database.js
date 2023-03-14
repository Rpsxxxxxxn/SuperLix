const mysql = require('mysql');

class Database {
    constructor() {
        this.connection = null;
    }

    onConnect() {
        this.connection = mysql.createConnection({
            host: '192.168.0.105',
            port: 3306,
            database: 'account_db',
            user: 'test02',
            password: 'test02#',
        });

        this.connection.connect();

        this.connection.on('error', function (err) {
            console.log('caught this error: ' + err.toString());
        });
    }

    onClose() {
        this.connection.end();
    }

    format(sql, params) {
        return mysql.format(sql, params);
    }

    query(sql, params) {
        return this.connection.query(sql, params);
    }

    async beginTransaction() {
        return this.connection.beginTransaction((err) => {
            if (err) {
                throw err; 
            }
        });
    }
}

module.exports = Database;