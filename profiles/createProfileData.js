const db = require('../database/db-pool'); // Убедитесь, что путь правильный

const createProfileData = async (ctx, data) => {


    // Проверяем обязательные поля на наличие значений
    // Проверка имени
    if (!data.name) {
        throw new Error('Поле "имя" обязательно для заполнения');
    }

    // Проверка фамилии
    if (!data.surname) {
        throw new Error('Поле "фамилия" обязательно для заполнения');
    }

    // Проверка возраста
    if (!data.age) {
        throw new Error('Поле "возраст" обязательно для заполнения');
    }

    // Проверка дополнительной информации
    if (!data.info) {
        throw new Error('Поле "информация" обязательно для заполнения');
    }

    // Проверка цели
    if (!data.goal) {
        throw new Error('Поле "цель" обязательно для заполнения');
    }

    // Проверка области поиска
    if (!data.search) {
        throw new Error('Поле "область поиска" обязательно для заполнения');
    }

    // Проверка идентификатора файла
    if (!data.fileId) {
        throw new Error('Поле "идентификатор файла" обязательно для заполнения');
    }

    // Проверка пути к файлу
    if (!data.filePath) {
        throw new Error('Поле "путь к файлу" обязательно для заполнения');
    }
    let conn;
    try {
        conn = await db.getConnection();

        // Определяем тип файла на основе контекста сообщения
        let fileType = 'unknown';

        if (ctx.message.photo) {
            fileType = 'photo';
        } else if (ctx.message.video) {
            fileType = 'video';
        }

        const params = [
            ctx.from.id, // или ctx.message.from.id в зависимости от вашего контекста
            ctx.from.username,
            data.name,
            data.surname,
            data.age,
            data.info,
            data.search,
            data.goal,
            data.fileId, // Убедитесь, что эти поля существуют в объекте data
            data.filePath, // Убедитесь, что эти поля существуют в объекте data
            fileType
        ];

        const sql = `
            INSERT INTO users
                (telegram_id, username, name, surname, age, info, search, goal, fileId, filePath, fileType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                username = VALUES(username), 
                name = VALUES(name), 
                surname = VALUES(surname), 
                age = VALUES(age), 
                info = VALUES(info), 
                search = VALUES(search), 
                goal = VALUES(goal), 
                fileId = VALUES(fileId), 
                filePath = VALUES(filePath), 
                fileType = VALUES(fileType);
        `;

        console.log("Вставляемые параметры:", params);

        // Выполняем запрос к базе данных
        await conn.query(sql, params);
        console.log("Данные успешно сохранены в БД.");

    } catch (error) {
        console.error("Ошибка при вставке данных в БД:", error);
        // Обработка ошибки
        throw error;
    } finally {
        // Важно закрыть соединение, когда оно больше не нужно
        if (conn) conn.release();
    }
};

module.exports = {
    createProfileData
};