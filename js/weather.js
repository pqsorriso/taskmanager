/**
 * weather.js — Widget de clima simples
 * Usa a API gratuita wttr.in (sem API key)
 * Fallback se não tiver internet
 */
const Weather = (() => {
  const CITY = 'Joinville';
  const CACHE_KEY = 'fceux_weather';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  const weatherIcons = {
    'Clear': '☀️',
    'Sunny': '☀️',
    'Partly cloudy': '⛅',
    'Cloudy': '☁️',
    'Overcast': '☁️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Rain': '🌧️',
    'Light rain': '🌦️',
    'Heavy rain': '🌧️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Drizzle': '🌦️'
  };

  function init() {
    loadWeather();
    // Atualizar a cada 30 minutos
    setInterval(loadWeather, CACHE_DURATION);
  }

  async function loadWeather() {
    // Tentar cache primeiro
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          display(data);
          return;
        }
      }
    } catch (e) {}

    // Buscar da API
    try {
      const response = await fetch('https://wttr.in/' + CITY + '?format=j1');
      if (!response.ok) throw new Error('API error');
      const json = await response.json();

      const current = json.current_condition[0];
      const data = {
        temp: current.temp_C,
        desc: current.lang_pt ? current.lang_pt[0].value : current.weatherDesc[0].value,
        icon: getIcon(current.weatherDesc[0].value),
        timestamp: Date.now()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      display(data);
    } catch (e) {
      console.log('[Weather] Erro:', e);
      document.getElementById('weatherDesc').textContent = 'Offline';
      document.getElementById('weatherIcon').textContent = '🌐';
      document.getElementById('weatherTemp').textContent = '--°C';
    }
  }

  function display(data) {
    document.getElementById('weatherIcon').textContent = data.icon;
    document.getElementById('weatherTemp').textContent = data.temp + '°C';
    document.getElementById('weatherDesc').textContent = data.desc;
  }

  function getIcon(desc) {
    for (const key in weatherIcons) {
      if (desc.toLowerCase().includes(key.toLowerCase())) {
        return weatherIcons[key];
      }
    }
    return '🌤';
  }

  return { init };
})();