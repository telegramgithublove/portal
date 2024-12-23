const { Telegraf, Markup, Scenes, session } = require('telegraf');
const db = require('./database/db-pool');





const insertOrUpdateGender = async (userId, gender) => {
    const conn = await db.getConnection();
    console.log(`Проверяем существование пользователя с ID: ${userId} и полом: ${gender}`);
    const userExists = await conn.query('SELECT 1 FROM users WHERE telegram_id = ?', [userId]);
    if (userExists.length > 0) {
        console.log(`Обновляем пол пользователя с ID: ${userId}`);
        await conn.query('UPDATE users SET gender = ? WHERE telegram_id = ?', [gender, userId]);
    } else {
        console.log(`Вставляем нового пользователя с ID: ${userId} и полом: ${gender}`);
        await conn.query('INSERT INTO users (telegram_id, gender) VALUES (?, ?)', [userId, gender]);
    }
    await conn.end(); // Не забудьте закрыть соединение после запроса
}

const insertOrUpdateGenderSearch = async (userId, gendersearch) => {
    const conn = await db.getConnection();
    console.log(`Проверяем существование пользователя с ID: ${userId} и полом: ${gendersearch}`);
    const userExists = await conn.query('SELECT 1 FROM users WHERE telegram_id = ?', [userId]);
    if (userExists.length > 0) {
        console.log(`Обновляем пол пользователя с ID: ${userId}`);
        await conn.query('UPDATE users SET gendersearch = ? WHERE telegram_id = ?', [gendersearch, userId]);
    } else {
        console.log(`Вставляем нового пользователя с ID: ${userId} и полом: ${gendersearch}`);
        await conn.query('INSERT INTO users (telegram_id, gendersearch) VALUES (?, ?)', [userId, gendersearch]);
    }
    await conn.end(); // Не забудьте закрыть соединение после запроса
}


module.exports = {
    insertOrUpdateGender,
    insertOrUpdateGenderSearch
};

