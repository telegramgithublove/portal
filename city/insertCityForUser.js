const db = require('../database/db-pool');
async function insertCityForUser(telegramId, selectedCity) {
    let conn;
    try {
        conn = await db.getConnection();
        const query = `
            INSERT INTO users (telegram_id, city)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE city = VALUES(city);
        `;
        const result = await conn.query(query, [telegramId, selectedCity]);
        return result;
    } catch (error) {
        console.error('An error occurred while inserting/updating the city for the user:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    insertCityForUser,

};