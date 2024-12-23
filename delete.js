
const db = require('./database/db-pool');

const deleteUser = async (userId) => {
    let conn;

    try {
        conn = await db.getConnection();
        const result = await conn.query('DELETE FROM users WHERE telegram_id = ?', [userId]);

        if (result.affectedRows > 0) {
            return true; // Успешно удалено
        } else {
            return false; // Пользователь не найден
        }
    } catch (err) {
        console.error('Ошибка при удалении анкеты:', err);
        return false; // Ошибка при удалении пользователя
    } finally {
        if (conn) conn.end();
    }
};

const deleteFunction = async (ctx) => {
    const userId = ctx.from.id; // Получение userId из объекта ctx
    let userDeleted = false;
    try {
        userDeleted = await deleteUser(userId);
    } catch (err) {
        console.error('Ошибка при выполнении функции удаления:', err);
    }
    if (userDeleted) {
        ctx.reply('🎉 Ваша анкета была успешно удалена! Вы всегда можете создать новую, если захотите вернуться.');
    } else {
        ctx.reply('😕 Кажется, у вас нет заполненной анкеты. Если хотите создать её, просто воспользуйтесь соответствующей командой.');
    }

    let text = "🗂️\n\n";
    ctx.reply(text, {
        reply_markup: {
            keyboard: [
                [{text: 'Вернуться в главное меню'}],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
};

module.exports = {
    deleteFunction
};

