const { createProfileData } = require('./createProfileData');
const { showProfile } = require('./showProfile');

const createAndShowProfile = async (ctx, fileId = null, fileType = null, filePath = null) => {
    try {
        console.log('Создание/обновление профиля с медиафайлом:', { fileId, fileType, filePath });

        let conn;
        try {
            const db = require('../database/db-pool');
            conn = await db.getConnection();

            // Проверяем, существует ли уже профиль
            const [rows] = await conn.execute('SELECT * FROM users WHERE username = ?', [ctx.from.username]);
            
            if (rows && rows.length > 0) {
                // Если профиль существует и мы обновляем только медиафайл
                if (fileId && fileType) {
                    console.log('Обновление медиафайла для существующего профиля');
                    await conn.execute(
                        'UPDATE users SET fileId = ?, fileType = ?, filePath = ? WHERE username = ?',
                        [fileId, fileType, filePath, ctx.from.username]
                    );
                } else {
                    // Если нет медиафайла, обновляем остальные данные профиля
                    console.log('Обновление данных существующего профиля');
                    await createProfileData(ctx, ctx.session.data);
                }
            } else {
                // Создаем новый профиль
                console.log('Создание нового профиля');
                await createProfileData(ctx, {
                    ...ctx.session.data,
                    fileId,
                    fileType,
                    filePath
                });
            }
        } finally {
            if (conn) await conn.release();
        }

        // Показываем обновленный профиль
        await showProfile(ctx);
        
    } catch (error) {
        console.error('Error updating and showing profile:', error);
        if (error.message.includes('обязательно для заполнения')) {
            await ctx.reply('⚠️ ' + error.message + '. Пожалуйста, заполните все обязательные поля анкеты.');
        } else {
            await ctx.reply('Произошла ошибка при обновлении профиля. Пожалуйста, попробуйте еще раз.');
        }
    }
};

module.exports = {
    createAndShowProfile
};