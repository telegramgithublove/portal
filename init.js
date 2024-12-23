require('dotenv').config();
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const util = require('util');
const { startCommand } = require ("./keyboards/greatKey");
const { deleteFunction } = require ("./delete")
const { createScenes } = require ('./scenes')
const { getUserProfile } = require ('./profiles/createProfileData')
const { dateUsers } = require('./DateUsers')
const { sendProfile } = require('./profiles/sendProfile')
const { showProfile } = require('./profiles/showProfile')
const  { offer } = require('./offer')
const db = require("./database/db-pool");



bot.use(session());

bot.hears('Вернуться в главное меню', startCommand);
bot.command('start', startCommand);
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    if (!ctx.session.profiles) {
        ctx.session.profiles = []; // Инициализируйте массив анкет здесь
    }
    if (ctx.session.currentUserIndex === undefined) {
        ctx.session.currentUserIndex = 0; // Инициализируйте индекс текущего пользователя
    }
    return next()
});




createScenes(bot)



bot.action('fill_form', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.scene.enter('firstQuestion');
    } catch (err) {
        console.error("Error responding to callback query:", err);
        // Optionally, inform the user (consider the usability implications)
        await ctx.reply('Oops! There was an issue processing your request.');
    }
});

bot.action('update', (ctx) => {
    startCommand(ctx);
});

bot.action('updater', (ctx) => {
    startCommand(ctx);
});

bot.action('delete', async (ctx) => {
    try {
        await deleteFunction(ctx);
    } catch (err) {
        console.error(err);
        ctx.reply('У вас нету заполненной анкеты.');
    }
});


bot.action('search', async (ctx) => {
    try {
        await ctx.answerCbQuery();


        await dateUsers(ctx);


    } catch (err) {
        console.error("Error responding to callback query:", err);
        await ctx.reply('Oops! There was an issue processing your request.');
    }
});


bot.action('fill_form', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('firstQuestion');
});

bot.action('next', async (ctx) => {
    // Убедитесь, что ctx.session.currentProfileIndex и ctx.session.profiles определены
    if (ctx.session.profiles && typeof ctx.session.currentProfileIndex !== 'undefined') {
        const nextIndex = ctx.session.currentProfileIndex + Math.floor(Math.random() * 2) + 2; // Выбираем случайный индекс через 2 или 3 анкеты
        ctx.session.currentProfileIndex = nextIndex % ctx.session.profiles.length; // Обеспечиваем зацикливание, если достигнут конец списка

        await sendProfile(ctx); // Отправить текущую (возможно зациклившуюся) анкету

    } else {
        // В случае отсутствия анкет или индекса, уведомить пользователя или загрузить анкеты
        ctx.reply('Анкеты не найдены или возникла проблема с их загрузкой. Попробуйте снова.');
    }
});

bot.action('like', async (ctx) => {
    const { profiles, currentProfileIndex } = ctx.session;

    if (profiles && Array.isArray(profiles) && currentProfileIndex < profiles.length) {
        const profile = profiles[currentProfileIndex];

        // Проверяем, есть ли у профиля имя пользователя (username)
        if (profile.username) {
            const telegramUrl = `https://t.me/${profile.username}`;
            ctx.reply(`Приятного общения 😼 ${telegramUrl}`);

        } else if (profile.telegram_id) {
            const firstName = `${profile.name} ${profile.surname}`;

            const formattedName = `[${firstName}](tg://user?id=${profile.telegram_id})`;
            const textPredict = "Приятного общения 😼"; // Замените эту строку на ваш текст
            const messageText = `${formattedName}, ${textPredict}`;

            ctx.replyWithMarkdownV2(messageText);

        } else {
            // Если нет ни имени пользователя, ни telegram_id
            ctx.reply('Информация о контакте пользователя отсутствует.');
        }

        let text = `👻`;

        ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{text: 'Вернуться в главное меню'}],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    }
});


bot.action('piar', (ctx) => {
    let text = "🎋\n\n";

// Добавляем клавиатуру после отправки медиафайла
    ctx.reply(text, {
        reply_markup: {
            keyboard: [
                [{text: 'Вернуться в главное меню'}],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
    ctx.reply('Если вам нужна пиар компания для продвижения продукта по разным городам, отдельным городам или по всей России, то вы попали по адресу! \n\n🚀 Мы предлагаем самую разнообразную аудиторию для вашей маркетинговой стратегии. \n\n💡 Наши маркетинговые схемы подходят под любые потребности и бюджеты. \n\n💰 Не знаете, с чего начать? Свяжитесь с нашим пиар-менеджером для получения всех подробностей и консультации.\n\nНадеемся на успешное сотрудничество! 🤝💼🌟\n\nПодробности и связь: [Написать пиар-менеджеру](https://t.me/piarmenegerlove)', { parse_mode: 'Markdown' });
});


bot.action('complain', (ctx) => {
    ctx.session.complainStep = 'waiting_for_complaint';
    ctx.reply('Пожалуйста, напишите текст вашей жалобы:');
});

bot.command('sendAd', async (ctx) => {
    try {
        const inviteLink = 'https://t.me/+7pzrwu-UNQg1MThi';
        const conn = await db.getConnection();
        const rows = await conn.query('SELECT * FROM users');
        conn.release();

        for (const row of rows) {
            try {
                if (row.telegram_id && row.telegram_id !== '') {
                    console.log('Отправка сообщения пользователю с telegram_id: ' + row.telegram_id);

                    const stringTelegramId = String(row.telegram_id);
                    const chat = await ctx.telegram.getChat(stringTelegramId);

                    if (chat) {
                        await ctx.telegram.sendMessage(stringTelegramId,  `
Привет! 🌟

Приглашаем тебя в наш Telegram чат знакомств! 💬❤️  
Здесь ты можешь встретить интересных людей, общаться и находить новых друзей! 🤗

Присоединяйся прямо сейчас и получи кучу новых эмоцийй от общения с ноовыми друзями! 🎉✨  
Ждем тебя! 😊 \n\n ${inviteLink} 
        `);
                        console.log('Сообщение успешно отправлено пользователю с telegram_id: ' + row.telegram_id);
                    } else {
                        console.log('Чат не найден для пользователя с telegram_id: ' + row.telegram_id);
                    }
                } else {
                    console.log('telegram_id не определен для пользователя');
                }
            } catch (error) {
                console.error(`Ошибка при отправке сообщения пользователю с telegram_id: ${row.telegram_id}`);
                console.error(error);
            }
        }

        ctx.reply('Реклама отправлена всем пользователям');
    } catch (error) {
        console.error(error);
        ctx.reply('Произошла ошибка при отправке рекламы');
    }
});

bot.on('text', async (ctx) => {
    if (ctx.session.complainStep === 'waiting_for_complaint') {
        const complaintText = ctx.message.text;
        let userIdentifier = ctx.from.username ? ctx.from.username : `ID ${ctx.from.id}`;
        const telegramUrl = ctx.from.username ? `https://t.me/${ctx.from.username}` : '';
        const messageText = `New complaint from ${userIdentifier}: ${complaintText}\nTelegram user channel: ${telegramUrl}`;

        await bot.telegram.sendMessage(6638651166, messageText);
        await ctx.reply('Ваша жалоба успешно отправлена на рассмотрение 🚔');
        ctx.session.complainStep = null;
    }
    let text = "🚓\n\n";

// Добавляем клавиатуру после отправки медиафайла
    ctx.reply(text, {
        reply_markup: {
            keyboard: [
                [{text: 'Вернуться в главное меню'}],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});

bot.action('rules', async (ctx) => {
    await ctx.reply('Политика конфиденциальности для использования бота для заполнения анкеты через телеграм-бота:\n' +
        '\n' +
        '1. Сбор и использование информации\n' +
        '    Вся предоставленная пользователями информация при использовании бота для заполнения анкеты через телеграм-бота является конфиденциальной до момента ее публикации на публичном телеграм-канале.\n' +
        '    Мы собираем следующую информацию при заполнении анкеты: фотография, имя, возраст, город, краткое описание о себе и партнера, а также контактные данные.\n' +
        '    Предоставленная информация будет использоваться для публикации анкет на публичном телеграм-канале, доступном другим пользователям.\n' +
        '\n' +
        '2. Защита личной информации\n' +
        '    Мы принимаем все необходимые меры для защиты личной информации пользователей до момента ее публикации. Мы обязуемся не передавать или продавать предоставленную информацию третьим лицам.\n' +
        '\n' +
        '3. Пользовательская ответственность\n' +
        '    Пользователи несут ответственность за предоставленную информацию и обязуются предоставлять достоверные данные.\n' +
        '\n' +
        '4. Публикация контактной информации\n' +
        '    Предоставляя свой контактный телеграм-аккаунт для связи, пользователи соглашаются на то, чтобы другие пользователи могли связаться с ними.\n' +
        '\n' +
        '5. Ответственность администрации\n' +
        '    Администрация канала не несет ответственности за любую информацию, предоставленную пользователями в анкете.\n' +
        '\n' +
        '6. Права пользователей\n' +
        '    Пользователи имеют право запросить удаление своей анкеты и личной информации в любое время.\n' +
        '\n' +
        '7. Обратная связь\n' +
        '    Пользователи могут обратиться к администрации по указанной ссылке @xxxhummingbird для вопросов или проблем, связанных с заполнением анкеты.\n' +
        '\n' +
        '8. Согласие с условиями\n' +
        '    Используя бот для заполнения анкеты, пользователи соглашаются с условиями данной политики конфиденциальности.');
    // Добавьте здесь логику для отображения политики конфиденциальности
    let text = "💼\n\n";

// Добавляем клавиатуру после отправки медиафайла
    ctx.reply(text, {
        reply_markup: {
            keyboard: [
                [{text: 'Вернуться в главное меню'}],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});



bot.action('agreement', async (ctx) => {
    await ctx.reply('Пользовательское соглашение\n' +
        '\n' +
        '1. При использовании бота для заполнения анкеты на канале, вы подтверждаете, что вы совершеннолетний.\n' +
        '\n' +
        '2. При заполнении анкеты вы соглашаетесь предоставить следующую информацию: фотографию, имя, возраст, город, короткое описание о себе, ожидаемого партнера и контактные данные.\n' +
        '\n' +
        '3. Вся предоставленная информация будет использоваться для опубликации анкеты на публичном телеграм-канале и может быть видимой другим пользователям.\n' +
        '\n' +
        '4. Пользователи несут ответственность за предоставленную информацию и обязуются предоставлять достоверные данные. \n' +
        '\n' +
        '5. Предоставляя свой контактный телеграм-аккаунт для связи, вы соглашаетесь на то, чтобы другие пользователи могли связаться с вами.\n' +
        '\n' +
        '6. Администрация канала не несет ответственности за любую информацию, предоставленную пользователем в анкете.\n' +
        '\n' +
        '7. В случае возникновения вопросов или проблем, связанных с заполнением анкеты, вы можете обратиться к администрации по указанной ссылке: @xxxhummingbird .\n' +
        '\n' +
        '8. В любой момент вы имеете право запросить удаление вашей анкеты. В таком случае мы незамедлительно удалим всю предоставленную вами информацию.\n' +
        '\n' +
        '9. Администрация оставляет за собой право вносить изменения в условия данного пользовательского соглашения. Любые изменения будут опубликованы на канале, и вы соглашаетесь с обязанностью периодически проверять изменения в условиях пользовательского соглашения. В случае продолжения использования бота для заполнения анкеты после публикации любых изменений, вы автоматически соглашаетесь с обновленными условиями.\n' +
        '\n' +
        '10. Пользуясь ботом для заполнения анкеты, вы соглашаетесь с условиями данного пользовательского соглашения.\n' +
        '\n' +
        'Спасибо за использование нашего бота для заполнения анкеты.');
    // Добавьте здесь логику для отображения политики конфиденциальности
    let text = "💼\n\n";

// Добавляем клавиатуру после отправки медиафайла
    ctx.reply(text, {
        reply_markup: {
            keyboard: [
                [{text: 'Вернуться в главное меню'}],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});
let text = "💝\n\n";
bot.action('chat_love', (ctx) => {
    ctx.reply('Добро пожаловать в чат знакомств! Присоединяйтесь к нам по ссылке: [Чат знакомств](https://t.me/samarafriends)', {
        parse_mode: 'Markdown',
    });

    ctx.reply('Выберите действие:', {
        reply_markup: {
            keyboard: [
                [{ text: 'Вернуться в главное меню' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});



bot.action('offer', (ctx) => {
    offer(ctx);
});

bot.action('anketa', (ctx) => {
    showProfile(ctx);
});

bot.launch();


