const mariadb = require('mariadb');
const dbConfig = require('./db-config.js');

const pool = mariadb.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    acquireTimeoutMillis: 20000, // 20 секунд
    connectionLimit: 20 // Предположим, что вы также хотите увеличить лимит соединений
});

async function getConnection() {
    return await pool.getConnection();
}

module.exports = {
    getConnection
};