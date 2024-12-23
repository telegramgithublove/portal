const { createProfileData } =  require('../profiles/createProfileData')
const { showProfile } =  require('../profiles/showProfile')

const createAndShowProfile = async (ctx, fileId, fileType, savedPath, data) => {
    const telegramId = String(ctx.from.id);

    try {
        // Вызываем функцию insertProfileData для вставки данных в базу данных
        await createProfileData(ctx, {
            ...ctx.session,
            fileId,
            fileType,
            filePath: savedPath,
            username: ctx.from.username,
            telegramId: telegramId,
            ...data
        });

        // Вызываем функцию showProfile для отображения обновленного профиля
        await showProfile(ctx);
    } catch (error) {
        console.error('Error updating and showing profile:', error);
        ctx.reply('Произошла ошибка при обновлении данных и отображении профиля.');
    }
};
module.exports = {
    createAndShowProfile,
};