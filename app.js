const CITY_STORAGE_KEY = "weatherAppLastCity";
const DEFAULT_CITY = "Sao Paulo";

const codeMap = {
  0: { text: "Clear", dayIcon: "☀️", nightIcon: "🌙" },
  1: { text: "Partly cloudy", dayIcon: "🌤️", nightIcon: "☁️" },
  2: { text: "Cloudy", dayIcon: "⛅", nightIcon: "☁️" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Drizzle", icon: "🌦️" },
  55: { text: "Dense drizzle", icon: "🌧️" },
  56: { text: "Freezing drizzle", icon: "🌧️" },
  57: { text: "Freezing drizzle", icon: "🌧️" },
  61: { text: "Rain", icon: "🌧️" },
  63: { text: "Rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  66: { text: "Freezing rain", icon: "🌧️" },
  67: { text: "Freezing rain", icon: "🌧️" },
  71: { text: "Snow", icon: "🌨️" },
  73: { text: "Snow", icon: "🌨️" },
  75: { text: "Heavy snow", icon: "❄️" },
  77: { text: "Snow grains", icon: "❄️" },
  80: { text: "Rain showers", icon: "🌦️" },
  81: { text: "Rain showers", icon: "🌧️" },
  82: { text: "Heavy showers", icon: "🌧️" },
  85: { text: "Snow showers", icon: "🌨️" },
  86: { text: "Snow showers", icon: "🌨️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm + hail", icon: "⛈️" },
  99: { text: "Thunderstorm + hail", icon: "⛈️" }
};

let form;
let cityInput;
let cityNameEl;
let currentTempEl;
let currentConditionEl;
let tempHighEl;
let tempLowEl;
let hourlyMessageEl;
let hourlyListEl;
let dailyListEl;
let loadingEl;
let errorEl;

function cacheDomElements() {
  form = document.getElementById("search-form");
  cityInput = document.getElementById("city-input");
  cityNameEl = document.getElementById("city-name");
  currentTempEl = document.getElementById("current-temp");
  currentConditionEl = document.getElementById("current-condition");
  tempHighEl = document.getElementById("temp-high");
  tempLowEl = document.getElementById("temp-low");
  hourlyMessageEl = document.getElementById("hourly-message");
  hourlyListEl = document.getElementById("hourly-list");
  dailyListEl = document.getElementById("daily-list");
  loadingEl = document.getElementById("loading");
  errorEl = document.getElementById("error");

  const missing = [
    ["search-form", form],
    ["city-input", cityInput],
    ["city-name", cityNameEl],
    ["current-temp", currentTempEl],
    ["current-condition", currentConditionEl],
    ["temp-high", tempHighEl],
    ["temp-low", tempLowEl],
    ["hourly-message", hourlyMessageEl],
    ["hourly-list", hourlyListEl],
    ["daily-list", dailyListEl],
    ["loading", loadingEl],
    ["error", errorEl]
  ]
    .filter(([, el]) => !el)
    .map(([id]) => `#${id}`);

  if (missing.length > 0) {
    throw new Error(`Missing required element(s): ${missing.join(", ")}`);
  }
}

function setTheme(isDay) {
  document.body.classList.toggle("night", !isDay);
}

function setLoading(isLoading) {
  loadingEl.classList.toggle("hidden", !isLoading);
}

function showError(message = "") {
  if (!message) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    return;
  }

  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function getWeatherInfo(code, isDay = true) {
  const info = codeMap[code];
  if (!info) {
    return { text: "Unknown", icon: "❔" };
  }

  if (info.dayIcon || info.nightIcon) {
    return {
      text: info.text,
      icon: isDay ? (info.dayIcon || info.icon) : (info.nightIcon || info.icon)
    };
  }

  return { text: info.text, icon: info.icon };
}

async function getCityCoords(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for this city right now.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Try another name.");
  }

  const result = data.results[0];
  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude
  };
}

async function getForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current_weather: "true",
    hourly: "temperature_2m,weathercode,is_day",
    daily: "temperature_2m_max,temperature_2m_min,weathercode",
    timezone: "auto"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Weather forecast is unavailable now. Please try again.");
  }

  return response.json();
}

function renderCurrent(cityDisplayName, forecast) {
  const isDay = forecast.current_weather.is_day === 1;
  const currentTemp = Math.round(forecast.current_weather.temperature);
  const weather = getWeatherInfo(
    forecast.current_weather.weathercode,
    isDay
  );
  const high = Math.round(forecast.daily.temperature_2m_max[0]);
  const low = Math.round(forecast.daily.temperature_2m_min[0]);
  setTheme(isDay);

  cityNameEl.textContent = cityDisplayName;
  currentTempEl.textContent = `${currentTemp}°`;
  currentConditionEl.textContent = `${weather.icon} ${weather.text}`;
  tempHighEl.textContent = `H: ${high}°`;
  tempLowEl.textContent = `L: ${low}°`;
}

function renderHourly(forecast) {
  hourlyListEl.innerHTML = "";

  const now = new Date();
  const times = forecast.hourly.time;
  const temps = forecast.hourly.temperature_2m;
  const codes = forecast.hourly.weathercode;
  const isDay = forecast.hourly.is_day;
  const nowInfo = getWeatherInfo(
    forecast.current_weather.weathercode,
    forecast.current_weather.is_day === 1
  );

  const nowItem = document.createElement("div");
  nowItem.className = "hour-item";
  nowItem.innerHTML = `
    <p>Now</p>
    <p>${nowInfo.icon}</p>
    <p>${Math.round(forecast.current_weather.temperature)}°</p>
  `;
  hourlyListEl.appendChild(nowItem);

  const startIndex = times.findIndex((t) => new Date(t) > now);
  const from = startIndex >= 0 ? startIndex : 0;
  const to = Math.min(from + 11, times.length);

  for (let i = from; i < to; i += 1) {
    const hour = new Date(times[i]);
    const label = hour.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const info = getWeatherInfo(codes[i], isDay[i] === 1);

    const item = document.createElement("div");
    item.className = "hour-item";
    item.innerHTML = `
      <p>${label}</p>
      <p>${info.icon}</p>
      <p>${Math.round(temps[i])}°</p>
    `;

    hourlyListEl.appendChild(item);
  }

  const sixPmIndex = times.findIndex((t) => {
    const d = new Date(t);
    return d.getHours() === 18 && d >= now;
  });

  if (sixPmIndex !== -1) {
    const sixPmInfo = getWeatherInfo(codes[sixPmIndex], isDay[sixPmIndex] === 1);
    hourlyMessageEl.textContent = `${sixPmInfo.text} conditions expected around 6PM.`;
  } else {
    hourlyMessageEl.textContent = "Weather changes expected over the next few hours.";
  }
}

function renderDaily(forecast) {
  dailyListEl.innerHTML = "";

  const days = forecast.daily.time;
  const mins = forecast.daily.temperature_2m_min;
  const maxs = forecast.daily.temperature_2m_max;
  const codes = forecast.daily.weathercode;

  const weekMin = Math.min(...mins);
  const weekMax = Math.max(...maxs);
  const weekRange = Math.max(weekMax - weekMin, 1);

  days.slice(0, 7).forEach((day, i) => {
    const date = new Date(day);
    const dayLabel = i === 0 ? "Today" : date.toLocaleDateString([], { weekday: "short" });
    const min = Math.round(mins[i]);
    const max = Math.round(maxs[i]);
    const info = getWeatherInfo(codes[i]);

    const left = ((mins[i] - weekMin) / weekRange) * 100;
    const width = ((maxs[i] - mins[i]) / weekRange) * 100;

    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <span>${dayLabel}</span>
      <span>${info.icon}</span>
      <span>${min}°</span>
      <div class="range-track">
        <span class="range-bar" style="left:${left}%; width:${Math.max(width, 8)}%"></span>
      </div>
      <span>${max}°</span>
    `;

    dailyListEl.appendChild(row);
  });
}

async function loadWeatherByCity(city) {
  setLoading(true);
  showError("");

  try {
    const coords = await getCityCoords(city);
    const forecast = await getForecast(coords.latitude, coords.longitude);
    const cityDisplayName = `${coords.name}, ${coords.country}`;

    renderCurrent(cityDisplayName, forecast);
    renderHourly(forecast);
    renderDaily(forecast);

    localStorage.setItem(CITY_STORAGE_KEY, coords.name);
  } catch (error) {
    showError(error.message || "Something went wrong while loading weather data.");
  } finally {
    setLoading(false);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    cacheDomElements();
  } catch (error) {
    console.error(error.message);
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) {
      showError("Please type a city name.");
      return;
    }

    loadWeatherByCity(city);
  });

  const savedCity = localStorage.getItem(CITY_STORAGE_KEY) || DEFAULT_CITY;
  cityInput.value = savedCity;
  loadWeatherByCity(savedCity);
});
