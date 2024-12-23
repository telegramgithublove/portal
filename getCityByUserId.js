const db = require('../database/db-pool');
const { Telegraf, Markup, Scenes, session } = require('telegraf');

async function getCityByUserId(userId) {
    let conn;
    try {
        // Получение соединения из пула
        conn = await db.getConnection();

        // Выполнение SQL запроса
        const queryResult = await conn.query("SELECT city FROM users WHERE userId = ?", [userId]);

        // Проверка наличия результата
        if (queryResult.length > 0) {
            return queryResult[0].city; // Убедитесь, что это соответствует названию столбца в вашей БД
        } else {
            return null; // Возвращаем null, если пользователь не найден
        }
    } catch (error) {
        console.error('Ошибка получения города пользователя:', error);
        throw error; // Переброс ошибки
    } finally {
        // Освобождение соединения
        if (conn) conn.release();
    }
}

module.exports = {
    getCityByUserId
};