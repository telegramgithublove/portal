const db = require('../database/db-pool');

const createProfileData = async (userData, ctx) => {
    let conn;
    try {
        conn = await db.getConnection(); // Получаем соединение из пула

        // Вставляем данные анкеты в таблицу users, включая поле username
        const sql = `
            INSERT INTO users
            (telegram_id, username, name, surname, city, age, role, info, search, goal, fileId, filePath, fileType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const data = {
            name: userData.name,
            surname: userData.surname,
            city: userData.city,
            age: userData.age,
            role: userData.role,
            info: userData.info,
            search: userData.search,
            goal: userData.goal,
        };

        const fileId = userData.fileId;
        const filePath = userData.filePath;
        const fileType = userData.fileType;

        const result = await conn.query(sql, [
            ctx.from.id,
            ctx.from.username,
            data.name,
            data.surname,
            data.city,
            data.age,
            data.role,
            data.info,
            data.search,
            data.goal,
            fileId,
            filePath,
            fileType,
        ]);
        console.log(result);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            ctx.reply('Вы уже заполняли анкету. Анкету можно заполнить только один раз!');
            return;
        }

        console.error('Ошибка вставки данных: ', error);
        ctx.reply('Произошла ошибка при сохранении данных');
    } finally {
        if (conn) {
            conn.release(); // Всегда освобождаем соединение обратно в пул
        }
    }
};
module.exports = {
    createScenes,

};