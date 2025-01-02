const { Telegraf, Markup, Scenes, session } = require('telegraf');
const axios = require('axios');
const db = require('./database/db-pool');
const { createAndShowProfile } = require('./profiles/createAndShowProfile.js');
const { insertOrUpdateGender } = require('./insertOrUpdateGender');
const { insertOrUpdateGenderSearch } = require('./insertOrUpdateGender')
const { insertCityForUser } = require('./city/insertCityForUser');
const { showProfile } = require('./profiles/showProfile.js');
const path = require('path');
const fs = require('fs').promises;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Создаем директорию для загрузок, если она не существует
const downloadsDir = path.join(__dirname, 'downloads');
(async () => {
    try {
        await fs.mkdir(downloadsDir, { recursive: true });
        console.log('Директория для загрузок создана или уже существует:', downloadsDir);
    } catch (error) {
        console.error('Ошибка при создании директории для загрузок:', error);
    }
})();

function createScenes(bot) {

    const firstQuestionScene = new Scenes.BaseScene('firstQuestion');
    const secondQuestionScene = new Scenes.BaseScene('secondQuestion');
    const nameScene = new Scenes.BaseScene('name');
    const surnameScene = new Scenes.BaseScene('surname');
    const cityScene = new Scenes.BaseScene('city');
    const ageScene = new Scenes.BaseScene('age');
    const infoScene = new Scenes.BaseScene('info');
    const searchScene = new Scenes.BaseScene('search');
    const goalScene = new Scenes.BaseScene('goal');
    const mediaScene = new Scenes.BaseScene('mediaScene');
    const endScene = new Scenes.BaseScene('end');

    firstQuestionScene.enter(async (ctx) => {
        let text = 'Что бы составить анкету. Вам нужно ответить на несколько небольших вопросов  💯  : ';
        await ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{text: 'Вернуться в главное меню '}],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });

        await ctx.reply(
            'Сначала определимся с вашим полом ⚧:',
            Markup.inlineKeyboard([
                Markup.button.callback('Я парень 👨', 'mann'),
                Markup.button.callback('Я девушка 👱‍♀️', 'womann'),
            ])
        );
    });


    firstQuestionScene.action('mann', async (ctx) => {
        const userId = ctx.from.id; 
        const gender = 'парень'; 

        await ctx.answerCbQuery();
        await ctx.reply('Вы выбрали "Я парень" 👨');
        
        // Инициализируем объект данных, если его нет
        ctx.session.data = ctx.session.data || {};
        ctx.session.data.gender = gender;
        console.log('Сохранен пол в сессию:', ctx.session.data.gender);
        
        let conn;
        try {
            conn = await db.getConnection();
            
            // Проверяем существование пользователя
            const [users] = await conn.query(
                'SELECT * FROM users WHERE telegram_id = ?',
                [userId]
            );

            if (users.length === 0) {
                // Создаем нового пользователя
                await conn.query(
                    'INSERT INTO users (telegram_id, gender, username) VALUES (?, ?, ?)',
                    [userId, gender, ctx.from.username]
                );
                console.log('Создан новый пользователь:', { userId, gender, username: ctx.from.username });
            } else {
                // Обновляем существующего пользователя
                await conn.query(
                    'UPDATE users SET gender = ?, username = ? WHERE telegram_id = ?',
                    [gender, ctx.from.username, userId]
                );
                console.log('Обновлен существующий пользователь:', { userId, gender, username: ctx.from.username });
            }
        } catch (error) {
            console.error('Ошибка при работе с БД:', error);
            await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            return;
        } finally {
            if (conn) await conn.release();
        }

        return ctx.scene.enter('secondQuestion');
    });

    firstQuestionScene.action('womann', async (ctx) => {
        const userId = ctx.from.id; 
        const gender = 'девушка'; 

        await ctx.answerCbQuery();
        await ctx.reply('Вы выбрали "Я девушка" 👱‍♀️');
        
        // Инициализируем объект данных, если его нет
        ctx.session.data = ctx.session.data || {};
        ctx.session.data.gender = gender;
        console.log('Сохранен пол в сессию:', ctx.session.data.gender);
        
        let conn;
        try {
            conn = await db.getConnection();
            
            // Проверяем существование пользователя
            const [users] = await conn.query(
                'SELECT * FROM users WHERE telegram_id = ?',
                [userId]
            );

            if (users.length === 0) {
                // Создаем нового пользователя
                await conn.query(
                    'INSERT INTO users (telegram_id, gender, username) VALUES (?, ?, ?)',
                    [userId, gender, ctx.from.username]
                );
                console.log('Создан новый пользователь:', { userId, gender, username: ctx.from.username });
            } else {
                // Обновляем существующего пользователя
                await conn.query(
                    'UPDATE users SET gender = ?, username = ? WHERE telegram_id = ?',
                    [gender, ctx.from.username, userId]
                );
                console.log('Обновлен существующий пользователь:', { userId, gender, username: ctx.from.username });
            }
        } catch (error) {
            console.error('Ошибка при работе с БД:', error);
            await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            return;
        } finally {
            if (conn) await conn.release();
        }

        return ctx.scene.enter('secondQuestion');
    });

    secondQuestionScene.enter(async (ctx) => {
        await ctx.reply("Теперь выберите кого вы ищете: 💕", Markup.inlineKeyboard([
            [
                Markup.button.callback('Парня 👨', 'search_mann'),
                Markup.button.callback('Девушку 👱‍♀️', 'search_womann')
            ],
            [
                Markup.button.callback('Любой пол 👤', 'any')
            ],
        ]));
    });

    secondQuestionScene.action('search_mann', async (ctx) => {
        const userId = ctx.from.id; 
        const gendersearch = 'парень'; 

        await ctx.answerCbQuery();
        await ctx.reply(`Вы выбрали: Парня 👨`);
        
        // Инициализируем объект данных, если его нет
        ctx.session.data = ctx.session.data || {};
        ctx.session.data.gendersearch = gendersearch;
        console.log('Сохранен искомый пол в сессию:', ctx.session.data.gendersearch);
        
        let conn;
        try {
            conn = await db.getConnection();
            await conn.query(
                'UPDATE users SET gendersearch = ? WHERE telegram_id = ?',
                [gendersearch, userId]
            );
            console.log('Искомый пол сохранен в БД:', gendersearch);
            await ctx.scene.enter('name');
        } catch (error) {
            console.error('Ошибка при сохранении искомого пола:', error);
            await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
        } finally {
            if (conn) await conn.release();
        }
    });

    secondQuestionScene.action('search_womann', async (ctx) => {
        const userId = ctx.from.id; 
        const gendersearch = 'девушка'; 

        await ctx.answerCbQuery();
        await ctx.reply(`Вы выбрали: Девушку 👱‍♀️`);
        
        // Инициализируем объект данных, если его нет
        ctx.session.data = ctx.session.data || {};
        ctx.session.data.gendersearch = gendersearch;
        console.log('Сохранен искомый пол в сессию:', ctx.session.data.gendersearch);
        
        let conn;
        try {
            conn = await db.getConnection();
            await conn.query(
                'UPDATE users SET gendersearch = ? WHERE telegram_id = ?',
                [gendersearch, userId]
            );
            console.log('Искомый пол сохранен в БД:', gendersearch);
            await ctx.scene.enter('name');
        } catch (error) {
            console.error('Ошибка при сохранении искомого пола:', error);
            await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
        } finally {
            if (conn) await conn.release();
        }
    });

    secondQuestionScene.action('any', async (ctx) => {
        const userId = ctx.from.id; 
        const gendersearch = 'любой'; 

        await ctx.answerCbQuery();
        await ctx.reply(`Вы выбрали: Любой пол 👤`);
        
        // Инициализируем объект данных, если его нет
        ctx.session.data = ctx.session.data || {};
        ctx.session.data.gendersearch = gendersearch;
        console.log('Сохранен искомый пол в сессию:', ctx.session.data.gendersearch);
        
        let conn;
        try {
            conn = await db.getConnection();
            await conn.query(
                'UPDATE users SET gendersearch = ? WHERE telegram_id = ?',
                [gendersearch, userId]
            );
            console.log('Искомый пол сохранен в БД:', gendersearch);
            await ctx.scene.enter('name');
        } catch (error) {
            console.error('Ошибка при сохранении искомого пола:', error);
            await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
        } finally {
            if (conn) await conn.release();
        }
    });

    nameScene.enter(async (ctx) => {
        await ctx.reply('Введите ваше имя:');
    });

    nameScene.on('text', async (ctx) => {
        const name = ctx.message.text.trim();

        if (!name) {
            await ctx.reply('Это поле обязательно для заполнения. Пожалуйста, введите ваше имя:');
        } else {
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.name = name;

            // Сохраняем имя и обновляем username в базу данных
            let conn;
            try {
                conn = await db.getConnection();
                await conn.query(
                    'UPDATE users SET name = ?, username = ? WHERE telegram_id = ?',
                    [name, ctx.from.username, ctx.from.id]
                );
                console.log('Имя сохранено в БД:', name);
                console.log('Username обновлен:', ctx.from.username);
                await ctx.scene.enter('surname');
            } catch (error) {
                console.error('Ошибка при сохранении имени:', error);
                await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            } finally {
                if (conn) await conn.release();
            }
        }
    });

    surnameScene.enter(async (ctx) => {
        await ctx.reply('Введите вашу фамилию:');
    });

    surnameScene.on('text', async (ctx) => {
        const surname = ctx.message.text.trim();

        if (!surname) {
            await ctx.reply('Это поле обязательно для заполнения. Пожалуйста, введите вашу фамилию:');
        } else {
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.surname = surname;

            // Сохраняем фамилию в базу данных
            let conn;
            try {
                conn = await db.getConnection();
                await conn.query(
                    'UPDATE users SET surname = ? WHERE telegram_id = ?',
                    [surname, ctx.from.id]
                );
                console.log('Фамилия сохранена в БД:', surname);
                await ctx.scene.enter('city');
            } catch (error) {
                console.error('Ошибка при сохранении фамилии:', error);
                await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            } finally {
                if (conn) await conn.release();
            }
        }
    });

    cityScene.enter(async (ctx) => {
        await ctx.reply('Выберите свой город: 🏙', {
            reply_markup: {
                keyboard: [
                    [{text: 'Вернуться в главное меню'}]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        await ctx.reply('Введите название города или первые 3-4 буквы для поиска 🔍');
    });

    cityScene.action(/^city_select_(.+)$/, async (ctx) => {
        const selectedCity = ctx.match[1];
        const telegramId = ctx.from.id;
        try {
            // Сохраняем город в сессию
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.city = selectedCity;
            console.log('Сохранен город в сессию:', ctx.session.data.city);

            // Сохраняем в базу данных
            await insertCityForUser(telegramId, selectedCity);
            await ctx.reply(`Вы выбрали город: ${selectedCity}`);
            return ctx.scene.enter('age');
        } catch (error) {
            console.error('Ошибка при сохранении города:', error);
            await ctx.reply('Произошла ошибка при сохранении города. Пожалуйста, попробуйте еще раз.');
            return ctx.scene.reenter();
        }
    });

    cityScene.on('text', async (ctx) => {
        const searchQuery = ctx.message.text.trim();
        
        if (searchQuery === 'Вернуться в главное меню') {
            return ctx.scene.enter('menu');
        }

        if (searchQuery.length < 3) {
            await ctx.reply('Пожалуйста, введите минимум 3 буквы для поиска города');
            return;
        }

        try {
            // Читаем файл с городами
            const cities = require('./city/cities.json');
            
            // Ищем города, которые содержат введенный текст
            const matchedCities = cities.filter(city => 
                city.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 10); // Берем только первые 10 результатов

            if (matchedCities.length === 0) {
                await ctx.reply('Города не найдены. Попробуйте другой запрос.');
                return;
            }

            // Создаем клавиатуру с найденными городами
            const keyboard = matchedCities.map(city => [{
                text: city.name,
                callback_data: `city_select_${city.name}`
            }]);

            // Добавляем кнопку возврата в главное меню
            keyboard.push([{
                text: 'Вернуться в главное меню',
                callback_data: 'back_to_menu'
            }]);

            await ctx.reply(
                'Выберите город из списка:',
                {
                    reply_markup: {
                        inline_keyboard: keyboard
                    }
                }
            );
        } catch (error) {
            console.error('Ошибка при поиске города:', error);
            await ctx.reply('Произошла ошибка при поиске города. Пожалуйста, попробуйте еще раз.');
        }
    });

    ageScene.enter(async (ctx) => {
        await ctx.reply('Введите ваш возраст (только цифры):');
    });

    ageScene.on('text', async (ctx) => {
        const age = Number(ctx.message.text);

        if (!age) {
            await ctx.reply('Поле возраста обязательно для заполнения. Пожалуйста, введите ваш возраст:');
        } else if (isNaN(age)) {
            await ctx.reply('Пожалуйста, введите возраст числом (например, 30):');
        } else if (age < 18 || age > 60) {
            await ctx.reply('Ваш возраст должен быть от 18 до 60 лет.');
        } else {
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.age = age;
            
            // Сохраняем возраст в базу данных
            let conn;
            try {
                conn = await db.getConnection();
                await conn.query(
                    'UPDATE users SET age = ? WHERE telegram_id = ?',
                    [age, ctx.from.id]
                );
                console.log('Возраст сохранен в БД:', age);
                await ctx.scene.enter('info');
            } catch (error) {
                console.error('Ошибка при сохранении возраста:', error);
                await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            } finally {
                if (conn) await conn.release();
            }
        }
    });

    // Сцена 'info'
    infoScene.enter(async (ctx) => {
        await ctx.reply('Расскажите немного о себе:');
    });

    infoScene.on('text', async (ctx) => {
        const info = ctx.message.text.trim(); 

        if (!info) {
            await ctx.reply('Это поле обязательно для заполнения. Пожалуйста, напишите немного о себе:');
        } else {
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.info = info;

            // Сохраняем информацию в базу данных
            let conn;
            try {
                conn = await db.getConnection();
                await conn.query(
                    'UPDATE users SET info = ? WHERE telegram_id = ?',
                    [info, ctx.from.id]
                );
                console.log('Информация сохранена в БД:', info);
                await ctx.scene.enter('search');
            } catch (error) {
                console.error('Ошибка при сохранении информации:', error);
                await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            } finally {
                if (conn) await conn.release();
            }
        }
    });

    // Сцена 'search'
    searchScene.enter(async (ctx) => {
        await ctx.reply('Опишите возраст или интересы кого вы хотели бы найти:');
    });

    searchScene.on('text', async (ctx) => {
        const search = ctx.message.text.trim();

        if (!search) {
            await ctx.reply('Это поле обязательно для заполнения. Пожалуйста, опишите кого вы ищете:');
        } else {
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.search = search;

            // Сохраняем поисковые предпочтения в базу данных
            let conn;
            try {
                conn = await db.getConnection();
                await conn.query(
                    'UPDATE users SET search = ? WHERE telegram_id = ?',
                    [search, ctx.from.id]
                );
                console.log('Поисковые предпочтения сохранены в БД:', search);
                await ctx.scene.enter('goal');
            } catch (error) {
                console.error('Ошибка при сохранении поисковых предпочтений:', error);
                await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            } finally {
                if (conn) await conn.release();
            }
        }
    });

    // Сцена 'goal'
    goalScene.enter(async (ctx) => {
        await ctx.reply('Какая у вас цель знакомства?');
    });

    goalScene.on('text', async (ctx) => {
        const goal = ctx.message.text.trim();

        if (!goal) {
            await ctx.reply('Это поле обязательно для заполнения. Пожалуйста, укажите цель знакомства:');
        } else {
            ctx.session.data = ctx.session.data || {};
            ctx.session.data.goal = goal;

            // Сохраняем цель знакомства в базу данных
            let conn;
            try {
                conn = await db.getConnection();
                await conn.query(
                    'UPDATE users SET goal = ? WHERE telegram_id = ?',
                    [goal, ctx.from.id]
                );
                console.log('Цель знакомства сохранена в БД:', goal);
                await ctx.scene.enter('mediaScene');
            } catch (error) {
                console.error('Ошибка при сохранении цели знакомства:', error);
                await ctx.reply('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.');
            } finally {
                if (conn) await conn.release();
            }
        }
    });

    console.log('Настройка mediaScene...');
    mediaScene.enter((ctx) => {
        console.log('Вход в mediaScene');
        console.log('User ID:', ctx.from.id);

        ctx.reply('Загрузите своё фото 🖼 или видео 🎥 (mp4) \n \n Макс. размер фото должен составлять не больше - 5 МБ ' +
            '\n Макс. размер видео должен составлять не больше - 50 МБ' +
            '\n \n Внимание! ⚠️ \n \n  Если вы загружаете фото или видео на котором изображение другого человека (т.е. не ваше фото), вы моментально попадаете в черный бан 🚫 нашего бота. \n \n Загрузить можно только одну фотографию или видео! ‍✈️' +
            '\n \n Можете использовать:\n' +
            '\n' +
            '⚧ Свою фотографию \n' +
            '\n' +
            '⚧ Аниме картинку\n' +
            '\n' +
            '⚧ Фотографии на которых нету лиц людей\n' +
            '\n' +
            '⚧ Мемасики\n' +
            '\n' +
            '⚧ Отрывки из фильмов\n' +
            '\n' +
            '⚧ Мем-видео\n' +
            '\n' +
            '⚧ Ваше Tik-Tok видео (mp4)\n' +
            '\n' +
            '⚧ Анимированные стикеры');
    });

    // Функция для определения типа файла
    const determineFileType = (filePath, mimeType) => {
        // Если есть MIME-тип, используем его
        if (mimeType) {
            if (mimeType.startsWith('image/')) return 'photo';
            if (mimeType.startsWith('video/')) return 'video';
        }
        
        // Если нет MIME-типа, определяем по расширению
        if (filePath) {
            const ext = filePath.toLowerCase();
            if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.gif')) {
                return 'photo';
            }
            if (ext.endsWith('.mp4') || ext.endsWith('.avi') || ext.endsWith('.mov') || ext.endsWith('.mkv')) {
                return 'video';
            }
        }
        
        return 'unknown';
    };

    const handleFile = async (ctx, fileId, fileSize, fileType, mimeType) => {
        console.log('=== Начало обработки файла ===');
        console.log('FileID:', fileId);
        console.log('FileSize:', fileSize);
        console.log('FileType:', fileType);
        console.log('MimeType:', mimeType);
    
        const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
        const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
    
        let conn;
        try {
            console.log('Получение информации о файле...');
            const file = await ctx.telegram.getFile(fileId);
            console.log('Файл получен:', file);
    
            if (!file || !file.file_path) {
                throw new Error('Не удалось получить путь к файлу.');
            }
    
            // Определяем тип файла
            const detectedFileType = determineFileType(file.file_path, mimeType);
            console.log('Определен тип файла:', detectedFileType);
            
            // Проверка размера в зависимости от типа
            if (detectedFileType === 'video' && fileSize > MAX_VIDEO_SIZE) {
                await ctx.reply('⚠️ Максимальный размер видео — 50 МБ. Попробуйте загрузить файл меньшего размера.');
                return;
            }
            if (detectedFileType === 'photo' && fileSize > MAX_PHOTO_SIZE) {
                await ctx.reply('⚠️ Максимальный размер фото — 5 МБ. Попробуйте загрузить файл меньшего размера.');
                return;
            }
    
            const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
            console.log('URL для загрузки:', url);
    
            console.log('Загрузка файла...');
            const response = await fetch(url);
    
            if (!response.ok) {
                throw new Error(`Ошибка загрузки файла: ${response.status} ${response.statusText}`);
            }
    
            console.log('Файл успешно загружен, получение буфера...');
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
    
            const savedPath = path.join(downloadsDir, `${fileId}${path.extname(file.file_path)}`);
            console.log('Путь для сохранения:', savedPath);
    
            console.log('Сохранение файла...');
            await fs.writeFile(savedPath, uint8Array);
            console.log('Файл успешно сохранён.');
    
            // Обновление информации пользователя в базе данных
            conn = await db.getConnection();
            await conn.query(
                'UPDATE users SET fileId = ?, fileType = ?, filePath = ? WHERE username = ? OR telegram_id = ?',
                [fileId, detectedFileType, savedPath, ctx.from.username, ctx.from.id]
            );
            console.log('Данные пользователя обновлены в базе данных');

            // Показываем обновленный профиль
            await showProfile(ctx);
            await ctx.reply('✅ Медиафайл успешно загружен!');
        } catch (error) {
            console.error('Ошибка при обработке файла:', error);
            await ctx.reply('Произошла ошибка при обработке файла. Пожалуйста, попробуйте еще раз.');
        } finally {
            if (conn) await conn.release();
        }
    };
    
    

    // Обработчик для фото и видео
// Обработка фото, видео и документов
    mediaScene.on(['photo', 'video', 'document'], async (ctx) => {
        try {
            console.log('Получено медиа сообщение:', ctx.message);
            
            let fileId;
            let fileType;
            let fileSize;
            let mimeType;

            // Обработка фото
            if (ctx.message.photo) {
                const photo = ctx.message.photo[ctx.message.photo.length - 1];
                fileId = photo.file_id;
                fileType = 'photo';
                fileSize = photo.file_size;
                mimeType = 'image/jpeg';
                console.log('Получено фото:', { fileId, fileSize });
            } 
            // Обработка видео
            else if (ctx.message.video) {
                fileId = ctx.message.video.file_id;
                fileType = 'video';
                fileSize = ctx.message.video.file_size;
                mimeType = ctx.message.video.mime_type;
                console.log('Получено видео:', { fileId, fileSize, mimeType });
            } 
            // Обработка документов
            else if (ctx.message.document) {
                const { file_id, file_size, mime_type } = ctx.message.document;
                fileId = file_id;
                fileSize = file_size;
                mimeType = mime_type;

                // Определяем тип файла по MIME-типу
                if (mime_type.startsWith('image/')) {
                    fileType = 'photo';
                    console.log('Получено изображение как документ:', { fileId, fileSize, mimeType });
                } else if (mime_type.startsWith('video/')) {
                    fileType = 'video';
                    console.log('Получено видео как документ:', { fileId, fileSize, mimeType });
                } else {
                    await ctx.reply('⚠️ Пожалуйста, отправьте фото или видео файл.');
                    return;
                }
            }

            if (!fileId || !fileType) {
                throw new Error('Не удалось получить данные файла')
            }

            // Сохраняем информацию в сессии
            ctx.session.data = {
                ...(ctx.session.data || {}),
                fileId,
                fileType,
                fileSize,
                mimeType
            };

            console.log('Обработка файла...', {
                fileId,
                fileType,
                fileSize,
                mimeType
            });

            // Обрабатываем файл
            await handleFile(ctx, fileId, fileSize, fileType, mimeType);

        } catch (error) {
            console.error('Ошибка при обработке медиафайла:', error);
            await ctx.reply('Произошла ошибка при обработке файла. Пожалуйста, попробуйте еще раз.');
        }
    });

    // Добавляем обработчик любого сообщения для отладки
    mediaScene.on('message', (ctx) => {
        console.log('Получено сообщение в mediaScene');
        console.log('Тип сообщения:', ctx.message);
    });

    // Добавляем endScene

    endScene.enter(async (ctx) => {
        console.log('Вход в endScene');
        try {
   

            // Inline-клавиатура с действиями
            await ctx.reply('Выберите действие:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Смотреть свою анкету 📄', callback_data: 'anketa' }],
                        [{ text: 'Изменить анкету 📝', callback_data: 'fill_form' }],
                        [{ text: 'Смотреть анкеты 💎', callback_data: 'search' }]
                    ]
                }
            });
    
            console.log('Сообщения в endScene успешно отправлены');
        } catch (error) {
            console.error('Ошибка в endScene:', error);
            await ctx.reply('Произошла ошибка. Попробуйте еще раз.');
        }
    });

    // Обработчики для обычных кнопок




    const scenes = [
        firstQuestionScene,
        secondQuestionScene,
        nameScene,
        surnameScene,
        cityScene,
        ageScene,
        infoScene,
        searchScene,
        goalScene,
        mediaScene
    ];

    scenes.forEach(scene => {
        scene.hears('Вернуться в главное меню', async (ctx) => {
            await ctx.reply('Вы вернулись в главное меню', {
                reply_markup: {
                    keyboard: [
                        ['Заполнить анкету ✍️'],
                        ['Смотреть анкеты 💎'],
                        ['Моя анкета 👤']
                    ],
                    resize_keyboard: true
                }
            });
            return ctx.scene.leave();
        });
    });

    const Stage = new Scenes.Stage([
        firstQuestionScene,
        secondQuestionScene,
        nameScene,
        surnameScene,
        cityScene,
        ageScene,
        infoScene,
        searchScene,
        goalScene,
        mediaScene,
        endScene
    ]);

    bot.use(Stage.middleware());
    return Stage;
}

function checkUploadedFiles(ctx) {
    if (!ctx.session.uploadedFiles) {
        ctx.session.uploadedFiles = [];
    }

    if (ctx.session.uploadedFiles.length > 0) {
        ctx.reply('Вы уже загрузили файл. Вы можете загрузить только один файл.');
        return true;
    }
    return false;
}

// Утилита для получения расширения файла
function fileExtension(fileId) {
    const parts = fileId.split('.');
    return parts.length > 1 ? parts.pop() : '';
}

module.exports = {
    createScenes,
};