import { useEffect, useState } from 'react'
import { useFetch } from './useFetch'

interface Forecast {
  current_weather: { temperature: number; windspeed: number; weathercode: number }
}

const DESCRIPTIONS: Record<number, [string, string]> = {
  0: ['Klar', '☀️'],
  1: ['Überwiegend klar', '🌤️'],
  2: ['Teilweise bewölkt', '⛅'],
  3: ['Bedeckt', '☁️'],
  45: ['Nebel', '🌫️'],
  61: ['Leichter Regen', '🌧️'],
  63: ['Regen', '🌧️'],
  71: ['Schneefall', '🌨️'],
  95: ['Gewitter', '⛈️'],
}

function usePosition() {
  const [position, setPosition] = useState<GeolocationCoordinates>()
  const [error, setError] = useState<string>()
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (result) => setPosition(result.coords),
      () => setError('Ohne Standort kann das Wetter nicht geladen werden.'),
    )
  }, [])
  return { position, error }
}

function Weather({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { data, error, status } = useFetch<Forecast>(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
  )

  if (status === 'loading') return <p>Lade Wetter…</p>
  if (status === 'error' || !data) return <p>Fehler: {error?.message}</p>

  const { temperature, windspeed, weathercode } = data.current_weather
  const [text, icon] = DESCRIPTIONS[weathercode] ?? ['Unbekannt', '❓']
  return (
    <section className="weather">
      <div className="icon">{icon}</div>
      <p className="temperature">{temperature.toLocaleString('de-DE')} °C</p>
      <p>{text}</p>
      <p>Wind: {windspeed} km/h</p>
    </section>
  )
}

export default function App() {
  const { position, error } = usePosition()
  return (
    <main>
      {error && <p>{error}</p>}
      {!position && !error && <p>Ermittle Standort…</p>}
      {position && <Weather latitude={position.latitude} longitude={position.longitude} />}
    </main>
  )
}
