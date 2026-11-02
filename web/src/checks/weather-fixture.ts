// Deterministic Open-Meteo response used in the test frame, so weather
// challenges can be checked without network access or location permission.
// It contains the common current/hourly/daily fields in both naming schemes
// of the API (`weathercode` and `weather_code`).

export const MOCK_POSITION = { latitude: 53.0736, longitude: 8.8064 }

const days = Array.from({ length: 7 }, (_, i) => `2026-11-${String(2 + i).padStart(2, '0')}`)
const hours = Array.from({ length: 24 * 7 }, (_, i) => `${days[Math.floor(i / 24)]}T${String(i % 24).padStart(2, '0')}:00`)
const repeat = <T,>(length: number, value: T) => Array.from({ length }, () => value)

export const WEATHER_FIXTURE = {
  latitude: MOCK_POSITION.latitude,
  longitude: MOCK_POSITION.longitude,
  timezone: 'Europe/Berlin',
  current_weather: { time: '2026-11-02T12:00', temperature: 17.3, windspeed: 12.4, winddirection: 240, weathercode: 3, is_day: 1 },
  current_units: { temperature_2m: '°C', apparent_temperature: '°C', wind_speed_10m: 'km/h', relative_humidity_2m: '%' },
  current: {
    time: '2026-11-02T12:00',
    temperature_2m: 17.3,
    apparent_temperature: 16.1,
    relative_humidity_2m: 71,
    weather_code: 3,
    weathercode: 3,
    wind_speed_10m: 12.4,
    wind_direction_10m: 240,
    precipitation: 0,
    is_day: 1,
  },
  hourly_units: { temperature_2m: '°C' },
  hourly: {
    time: hours,
    temperature_2m: repeat(hours.length, 17.3),
    apparent_temperature: repeat(hours.length, 16.1),
    weathercode: repeat(hours.length, 3),
    weather_code: repeat(hours.length, 3),
    precipitation: repeat(hours.length, 0),
    wind_speed_10m: repeat(hours.length, 12.4),
    windspeed_10m: repeat(hours.length, 12.4),
    wind_direction_10m: repeat(hours.length, 240),
    winddirection_10m: repeat(hours.length, 240),
    relative_humidity_2m: repeat(hours.length, 71),
  },
  daily_units: { temperature_2m_max: '°C', temperature_2m_min: '°C' },
  daily: {
    time: days,
    weathercode: repeat(7, 3),
    weather_code: repeat(7, 3),
    temperature_2m_max: repeat(7, 21.4),
    temperature_2m_min: repeat(7, 9.8),
    apparent_temperature_max: repeat(7, 20.1),
    apparent_temperature_min: repeat(7, 8.2),
    sunrise: days.map((d) => `${d}T07:12`),
    sunset: days.map((d) => `${d}T16:48`),
    precipitation_sum: repeat(7, 0),
    rain_sum: repeat(7, 0),
    showers_sum: repeat(7, 0),
    snowfall_sum: repeat(7, 0),
    precipitation_hours: repeat(7, 0),
    precipitation_probability_max: repeat(7, 10),
    windspeed_10m_max: repeat(7, 18.5),
    wind_speed_10m_max: repeat(7, 18.5),
    windgusts_10m_max: repeat(7, 32.1),
    wind_gusts_10m_max: repeat(7, 32.1),
    winddirection_10m_dominant: repeat(7, 240),
    wind_direction_10m_dominant: repeat(7, 240),
  },
}

/** Test bootstrap: fake geolocation and answer Open-Meteo requests with the fixture. */
export const WEATHER_TEST_BOOTSTRAP = `
window.__fc.mockGeo = { coords: { latitude: ${MOCK_POSITION.latitude}, longitude: ${MOCK_POSITION.longitude}, accuracy: 10 }, timestamp: Date.now() };
window.__fc.mockFetch = function (input) {
  var url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
  if (/open-meteo\\.com/.test(url)) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(new Response(${JSON.stringify(JSON.stringify(WEATHER_FIXTURE))}, { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }, 20);
    });
  }
  return Promise.reject(new TypeError('Im Test sind nur Anfragen an open-meteo.com erlaubt: ' + url));
};`

/** Temperatures from the fixture, as they might be displayed (17.3 → "17,3°", "17 °C", …). */
export const FIXTURE_TEMPERATURE = /(17|21|9|10|16)([.,]\d+)?\s*°/

/** Weather code 3 = overcast. */
export const FIXTURE_DESCRIPTION = /bewölkt|bedeckt|wolkig|wolke|overcast|cloud|☁/i
