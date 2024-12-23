const { Telegraf, Markup, Scenes, session } = require('telegraf');
const axios = require('axios');

async function loadCities() {
    // Загрузка данных о городах
    const response = await axios.get('https://api.jsonbin.io/v3/b/66197e90acd3cb34a83768c4');
    return response.data.record; // Возвращаем список городов
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Функция вычисления расстояния
    const rad = Math.PI / 180;
    const dlat = rad * (lat2 - lat1);
    const dlon = rad * (lon2 - lon1);
    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(rad * lat1) * Math.cos(rad * lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c; // Расстояние в километрах
}

async function sortProfilesByDistance(currentUserCity, profiles) {
    const cities = await loadCities();

    // Найдите координаты города текущего пользователя с проверкой на undefined
    const currentUserObj = cities.find(city => city.name === currentUserCity);

    if (!currentUserObj) {
        console.error('Город пользователя не найден.');
        return [];
    }

    const currentUserCityCoords = currentUserObj.coords;

    profiles.forEach(profile => {
        // Найдите координаты города каждого пользователя с защитой от undefined
        const cityCoords = Object.values(cities).find(city => city.name === profile.city)?.coords;

        if (cityCoords) {
            // Вычислите и сохраните расстояние для каждого пользователя
            profile.distance = calculateDistance(currentUserCityCoords.lat, currentUserCityCoords.lon, cityCoords.lat, cityCoords.lon);
        } else {
            profile.distance = null; // Если координаты города не найдены
        }
    });

    // Отсортируйте пользователей по расстоянию
    profiles.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
    });

    return profiles;
}

module.exports = {
    sortProfilesByDistance
}