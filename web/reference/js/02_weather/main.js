const app = document.getElementById('app')

// WMO weather codes as used by Open-Meteo
const WEATHER = {
  0: { text: 'Klar', icon: '☀️', mood: 'clear' },
  1: { text: 'Überwiegend klar', icon: '🌤️', mood: 'clear' },
  2: { text: 'Teilweise bewölkt', icon: '⛅', mood: 'clouds' },
  3: { text: 'Bedeckt', icon: '☁️', mood: 'clouds' },
  45: { text: 'Nebel', icon: '🌫️', mood: 'clouds' },
  48: { text: 'Raureifnebel', icon: '🌫️', mood: 'clouds' },
  51: { text: 'Leichter Nieselregen', icon: '🌦️', mood: 'rain' },
  61: { text: 'Leichter Regen', icon: '🌧️', mood: 'rain' },
  63: { text: 'Regen', icon: '🌧️', mood: 'rain' },
  65: { text: 'Starker Regen', icon: '🌧️', mood: 'rain' },
  71: { text: 'Leichter Schneefall', icon: '🌨️', mood: 'snow' },
  80: { text: 'Regenschauer', icon: '🌦️', mood: 'rain' },
  95: { text: 'Gewitter', icon: '⛈️', mood: 'rain' },
}

function describe(code) {
  return WEATHER[code] ?? { text: 'Unbekannt', icon: '❓', mood: 'clouds' }
}

function render(weather) {
  const { text, icon, mood } = describe(weather.weathercode)
  document.body.classList.add(`weather-${mood}`)
  app.innerHTML = `
    <div class="icon">${icon}</div>
    <p class="temperature">${weather.temperature.toLocaleString('de-DE')} °C</p>
    <p class="description">${text}</p>
    <p>Wind: ${weather.windspeed} km/h</p>
  `
}

function showError(message) {
  app.innerHTML = `<p class="status">${message}</p>`
}

async function loadWeather({ latitude, longitude }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe%2FBerlin`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Status ${response.status}`)
  const data = await response.json()
  render(data.current_weather)
}

navigator.geolocation.getCurrentPosition(
  (position) => loadWeather(position.coords).catch((error) => showError(`Fehler: ${error.message}`)),
  () => showError('Ohne Standort kann das Wetter nicht geladen werden.'),
)
