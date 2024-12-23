const { Telegraf, Markup, Scenes, session } = require('telegraf');

const sendProfile = async (ctx) => {
    const { profiles, currentProfileIndex } = ctx.session;

    if (currentProfileIndex < profiles.length) {
        const profile = profiles[currentProfileIndex];

        let text = "🥇\n\n";

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


        // Определите тип медиафайла (фото или видео) на основе значения profile.fileType
        const mediaType = profile.fileType === 'photo' ? 'photo' : 'video';
        console.log('Sending media with fileId:', profile.fileId);

        if (profile.fileId) {
            try {
                await ctx.replyWithMediaGroup([
                    {
                        type: mediaType,
                        media: profile.fileId,
                        caption: `Имя: ${profile.name}\nФамилия: ${profile.surname}\nГород: ${profile.city}\nВозраст: ${profile.age}\nО себе: ${profile.info}\nИщу: ${profile.search}\nЦель знакомства: ${profile.goal}`,
                    },
                ]);
            } catch (e) {
                console.error('Ошибка при отправке медиагруппы:', e);
                // Дополнительная обработка ошибок здесь
            }
        } else {
            console.error('FileId is null, cannot send media.');
            // Возможное восстановление или уведомление пользователя здесь
        }

        // Создайте клавиатуру
        const keyboard = [
            [{ text: 'Пообщаться ‍🔥', callback_data: 'like' }],
            [{ text: 'Следующая анкета 🔎', callback_data: 'next' }],
            [{ text: 'Пожаловаться на анкету 👮🏼‍', callback_data: 'complain'}],
        ];

        // Отправьте клавиатуру и сообщение с анкетой
        await ctx.telegram.sendMessage(ctx.chat.id, 'Как вам анкета? 📄', {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });



    }
};

module.exports = {
    sendProfile
};