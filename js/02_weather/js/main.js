class WeatherApp {
  constructor() {
    this.temperature = document.getElementById("temperature");
    this.status = document.getElementById("status");
  }

  async getWeatherData(latitude, longitude) {
    try {
      const weatherApi = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code&hourly=temperature_2m,weather_code&current=temperature_2m,apparent_temperature,weather_code&timezone=Europe%2FBerlin`;

      const response = await fetch(weatherApi);
      const data = await response.json();
      return {
        temperature: data.current.temperature_2m,
        status: data.current.weather_code,
      };
    } catch {
      console.log("Keine daten gefunden!");
      return null;
    }
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const data = await this.getWeatherData(latitude, longitude);
          this.showWeather(data);
        },
        (error) => {
          console.log("Standort konnte nicht ermittelt werden");
          this.temperature.textContent =
            "Standort konnte nicht gelanden werden";
          this.status.textContent = "";
        }
      );
    } else {
      this.temperature.textContent = "Aktiviere deinen Standort";
    }
  }
  getweatherStatus(weatherCode) {
    const status = {
      0: "Klarer Himmel",
      1: "Überwiegend klar, teilweise bewölkt und bedeckt",
      2: "Überwiegend klar, teilweise bewölkt und bedeckt",
      3: "Überwiegend klar, teilweise bewölkt und bedeckt",
      45: "Nebel und ablagernder Raureifnebel",
      48: "Nebel und ablagernder Raureifnebel",
      51: "Nieselregen: Leichte, mäßig und starke Intensität",
      53: "Nieselregen: Leichte, mäßig und starke Intensität",
      55: "Nieselregen: Leichte, mäßig und starke Intensität",
      61: "Regen: Leichte, mittlere und starke Intensität",
      63: "Regen: Leichte, mittlere und starke Intensität",
      65: "Regen: Leichte, mittlere und starke Intensität",
      66: "Eisregen: Leichte und starke Intensität",
      67: "Eisregen: Leichte und starke Intensität",
      71: "Schneefall: Leichte, mäßige und starke Intensität",
      73: "Schneefall: Leichte, mäßige und starke Intensität",
      75: "Schneefall: Leichte, mäßige und starke Intensität",
      77: "Schneekörner",
      80: "Regenschauer: Leicht, mäßig und heftig",
      81: "Regenschauer: Leicht, mäßig und heftig",
      82: "Regenschauer: Leicht, mäßig und heftig",
      85: "Leichte und starke Schneeschauer",
      86: "Leichte und starke Schneeschauer",
    };
    return status[weatherCode] || "Unbekannter Status";
  }

  //vs code dev container erstellen
  // im docker console
  async showWeather(data) {
    if (data) {
      this.temperature.textContent = `${data.temperature}°C`;
      const weatherStatus = this.getweatherStatus(data.status);
      this.status.textContent = `${weatherStatus}`;
    } else {
      this.temperature.textContent = "Daten Können nicht geladen werden";
      this.status.textContent = "Es wurde kein Status gefunden";
    }
  }
}

const app = new WeatherApp();
app.getCurrentLocation();
