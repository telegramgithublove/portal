const db = require('../database/db-pool');
const { Telegraf, Markup, Scenes, session } = require('telegraf');

// Функция для безопасной сериализации объекта с BigInt
const safeStringify = (obj) => {
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    );
};

const showProfile = async (ctx) => {
    let conn;
    try {
        const userId = ctx.from.id;
        console.log('Показ профиля для пользователя:', userId);

        if (!userId) {
            console.error('ID пользователя не определен');
            await ctx.reply('❌ Ошибка: не удалось определить ваш ID. Пожалуйста, попробуйте позже.');
            return;
        }

        conn = await db.getConnection();
        
        console.log('Выполняем SQL запрос для пользователя:', {
            username: ctx.from.username,
            telegram_id: userId
        });
        
        // Получаем данные пользователя
        const [result] = await conn.execute(
            'SELECT * FROM users WHERE telegram_id = ?', 
            [userId]
        );
        
        console.log('Тип результата:', typeof result);
        console.log('Результат запроса:', safeStringify(result));

        // Преобразуем результат в массив, если это не массив
        const rows = Array.isArray(result) ? result : [result];
        
        if (!rows || rows.length === 0) {
            console.log('Данные пользователя не найдены');
            await ctx.reply('❌ Ваша анкета не найдена. Пожалуйста, заполните анкету!', {
                reply_markup: {
                    keyboard: [
                        ['Заполнить анкету ✍️'],
                        ['Вернуться в главное меню']
                    ],
                    resize_keyboard: true
                }
            });
            return;
        }

        const user = rows[0];
        console.log('Данные пользователя:', safeStringify(user));

        if (!user || typeof user !== 'object') {
            console.log('Некорректные данные пользователя');
            await ctx.reply('❌ Ошибка при получении данных анкеты. Пожалуйста, попробуйте позже.');
            return;
        }

        // Проверяем наличие обязательных полей с дефолтными значениями
        const userData = {
            name: user.name?.toString() || 'Не указано',
            surname: user.surname?.toString() || 'Не указано',
            city: user.city?.toString() || 'Не указано',
            age: user.age?.toString() || 'Не указано',
            info: user.info?.toString() || 'Не указано',
            gender: user.gender?.toString() || 'Не указано',
            gendersearch: user.gendersearch?.toString() || 'Не указано',
            search: user.search?.toString() || 'Не указано',
            goal: user.goal?.toString() || 'Не указано',
            fileId: user.fileId || null,
            fileType: user.fileType || null,
            filePath: user.filePath || null
        };

        console.log('Подготовленные данные пользователя:', safeStringify(userData));

        const caption = `👤 ВАША АНКЕТА:\n\n` +
            `👤 Имя: ${userData.name}\n` +
            `👥 Фамилия: ${userData.surname}\n` +
            `🌎 Город, Страна: ${userData.city}\n` +
            `📓 Возраст: ${userData.age}\n` +
            `📬 О себе: ${userData.info}\n` +
            `🔍 Я: ${userData.gender}\n` +
            `🔍 Ищу: ${userData.gendersearch}\n` +
            `☀ Интересы: ${userData.search}\n` +
            `💕 Цель знакомства: ${userData.goal}`;

        const replyMarkup = {
            keyboard: [
                [{ text: 'Вернуться в главное меню' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        };

        // Отправляем медиафайл с подписью
        if (userData.fileId) {
            try {
                console.log('Отправка медиафайла:', { 
                    fileId: userData.fileId, 
                    fileType: userData.fileType 
                });
                
                const effectiveFileType = userData.fileType || 
                    (userData.filePath && (
                        userData.filePath.toLowerCase().endsWith('.jpg') || 
                        userData.filePath.toLowerCase().endsWith('.jpeg') || 
                        userData.filePath.toLowerCase().endsWith('.png')
                    )) ? 'photo' : 'video';
                
                console.log('Эффективный тип файла:', effectiveFileType);

                try {
                    if (effectiveFileType === 'photo') {
                        await ctx.replyWithPhoto(userData.fileId, { 
                            caption,
                            parse_mode: 'HTML',
                            reply_markup: replyMarkup
                        });
                    } else if (effectiveFileType === 'video') {
                        await ctx.replyWithVideo(userData.fileId, { 
                            caption,
                            parse_mode: 'HTML',
                            reply_markup: replyMarkup
                        });
                    } else {
                        console.log('Пробуем отправить как документ');
                        await ctx.replyWithDocument(userData.fileId, {
                            caption,
                            parse_mode: 'HTML',
                            reply_markup: replyMarkup
                        });
                    }
                } catch (sendError) {
                    console.error('Ошибка при отправке конкретного типа медиа, пробуем как документ:', sendError);
                    await ctx.replyWithDocument(userData.fileId, {
                        caption,
                        parse_mode: 'HTML',
                        reply_markup: replyMarkup
                    });
                }
            } catch (mediaError) {
                console.error('Ошибка при отправке медиафайла:', mediaError);
                await ctx.reply('⚠️ Не удалось загрузить медиафайл. Пожалуйста, попробуйте обновить анкету.');
                await ctx.reply(caption, {
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                });
            }
        } else {
            await ctx.reply(caption, {
                parse_mode: 'HTML',
                reply_markup: replyMarkup
            });
        }

        // Инлайн клавиатура
        const keyboard = [
            [{ text: 'Изменить анкету 📝', callback_data: 'fill_form' }],
            [{ text: 'Смотреть анкеты 💎', callback_data: 'search' }]
        ];

        await ctx.reply('Выберите действие:', {
            reply_markup: {
                inline_keyboard: keyboard
            }
        });

    } catch (error) {
        console.error('Ошибка при показе профиля:', error);
        await ctx.reply('❌ Произошла ошибка при показе профиля. Пожалуйста, попробуйте позже или заполните анкету заново.', {
            reply_markup: {
                keyboard: [
                    ['Заполнить анкету ✍️'],
                    ['Вернуться в главное меню']
                ],
                resize_keyboard: true
            }
        });
    } finally {
        if (conn) {
            try {
                await conn.release();
                console.log('Соединение с БД закрыто');
            } catch (error) {
                console.error('Ошибка при закрытии соединения:', error);
            }
        }
    }
};

module.exports = {
    showProfile
};