const { Telegraf, Markup, Scenes, session } = require('telegraf');



const isAdmin = async (ctx) => {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    return ['creator', 'administrator'].includes(member.status);
};

const startCommand = async (ctx) => {
    console.log('Пользователь запустил бота');
    try {
        ctx.session = {}; // Обнуляем всю сессию
        ctx.session.genderChoice = null; // Это пример обнуления конкретных данных сессии

        // Отправляем изображение с клавиатурой и текстом приветствия
        const imageUrl = 'https://i.ibb.co/0nJ8j7y/portal-1.jpg';
        await ctx.replyWithPhoto({ url: imageUrl });

        // Проверяем, является ли пользователь администратором
        const userIsAdmin = await isAdmin(ctx);

        // Создаем базовую клавиатуру
        let keyboard = [
            [
                Markup.button.callback('Заполните анкету 🚀', 'fill_form'),
                Markup.button.callback('Смотреть анкеты 💎', 'search'),
            ],
            [
                Markup.button.callback('Изменить свою анкету 📂', 'fill_form'),
                Markup.button.callback('Удалить свою анкету 🗑', 'delete'),
            ],
            [
                Markup.button.callback('Смотреть свою анкету 📄', 'anketa'),
            ],
            [
                Markup.button.callback('Что может предложить вам наш чат-бот знкомств? 🌿', 'offer'),
            ],
                [
                Markup.button.callback('Узнать о пиар компаних 📣', 'piar'),
                // Markup.button.callback('Приватный чат 🎉', 'private')
                ],
                [   Markup.button.callback('Политика конфиденциальности ', 'rules'),
                    Markup.button.callback('Пользовательское соглашение ', 'agreement'),
                ],
            [
                Markup.button.callback('Наш чат знакомств 💝', 'chat_love'),
            ],
        ];

        // Добавляем кнопку для администратора, если пользователь является администратором
        if (userIsAdmin) {
            keyboard.push([Markup.button.callback('Администрация 🛡', 'admin')]);
        }

        // Затем отправляем текст приветствия и клавиатуру
        await ctx.reply("Привет, друзья! 💫\n\n" +
            "Вас приветствует бот знакомств Portal 💟\n\nПрогрессивная социальная сеть на базе Telegraph\n\n" +
            "Если вдруг что-то пойдет не так, воспользуйтесь командой /start  🚀",
            Markup.inlineKeyboard(keyboard)
        );
        // await ctx.reply('[Написать пиар-менеджеру](https://t.me/adrianalucard)\n\n', { parse_mode: 'Markdown' });




    } catch (error) {
        console.error('Произошла ошибка:', error);
        ctx.reply('Зарегестрируйте, пожалуйста вашу анкеету! 📰',);
        ctx.reply('Произошла ошибка при загрузке картинки или отправке сообщения.');
    }
};



module.exports = { startCommand };