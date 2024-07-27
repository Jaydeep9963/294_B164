const fetch = require("node-fetch");
const readline = require("readline");
const chalk = require("chalk"); // Add chalk for colored output
const NodeCache = require("node-cache"); // Install node-cache: npm install node-cache

const apiKey = "8df612d1cd450c3595ec170dcf2ce070"; // Replace with your actual OpenWeatherMap API key
const weatherCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes (300 seconds)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showMenu() {
  console.log("\nChoose an option:");
  console.log("1. Get current weather");
  console.log("2. Get 3-day forecast");
  console.log("3. Exit");

  rl.question("Enter your choice: ", (choice) => {
    switch (choice) {
      case "1":
        getWeatherForCity(true);
        break;
      case "2":
        askForAnotherCity(false);
        break;
      case "3":
        rl.close();
        break;
      default:
        console.error("Invalid choice.");
        showMenu();
    }
  });
}

function getWeatherForCity() {
  rl.question("Enter city name: ", (city) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === 200) {
          const temp = data.main.temp;
          const description = data.weather[0].description;
          const icon = data.weather[0].icon;
          const iconUrl = `http://openweathermap.org/img/wn/${icon}@2x.png`;

          console.log(`Current weather in ${city}:`);
          console.log(`- Temperature: ${temp}°C`);
          console.log(`- Description: ${description}`);
          console.log(`- Icon: ${iconUrl}`);
        } else {
          console.error("City not found or API error.");
        }
      })
      .catch((error) => {
        console.error("Error fetching weather data:", error);
      })
      .finally(() => {
        rl.close();
      });
  });
}

function getForecastForCity(city, today = true) {
  if (weatherCache.has(city)) {
    console.log("Loading weather from cache...");
    const cachedData = weatherCache.get(city);
    displayWeather(cachedData, today);
    askForAnotherCity(today);
  } else {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === "200") {
          weatherCache.set(city, data);
          displayWeather(data);
        } else {
          console.error(`City not found or API error for ${city}.`);
        }
      })
      .catch((error) => {
        console.error(`Error fetching weather data for ${city}:`, error);
      })
      .finally(() => {
        askForAnotherCity(today);
      });
  }
}

function displayWeather(data, today) {
  const forecasts = data.list.slice(0, (today ? 1 : 3) * 8);

  for (let i = 0; i < forecasts.length; i += 8) {
    const date = new Date(forecasts[i].dt * 1000).toLocaleDateString();
    const temp = forecasts[i].main.temp;
    const description = forecasts[i].weather[0].description;
    const humidity = forecasts[i].main.humidity;
    const windSpeed = forecasts[i].wind.speed;

    const color = chalk.keyword(getColorForDescription(description));

    console.log(color(`\n--- ${date} ---`));
    console.log(color(`Temperature: ${temp}°C`));
    console.log(color(`Description: ${description}`));
    console.log(color(`Humidity: ${humidity}%`));
    console.log(color(`Wind Speed: ${windSpeed} m/s`));
  }
}

function askForAnotherCity(today) {
  rl.question('\nEnter city name or type "exit": ', (answer) => {
    if (answer.toLowerCase() === "exit") {
      rl.close();
    } else {
      getForecastForCity(answer, today);
    }
  });
}

function getColorForDescription(description) {
  switch (description) {
    case "clear sky":
      return "yellow";
    case "few clouds":
    case "scattered clouds":
    case "broken clouds":
      return "cyan";
    case "overcast clouds":
      return "gray";
    case "shower rain":
    case "rain":
    case "thunderstorm":
      return "blue";
    case "snow":
      return "white";
    default:
      return "white";
  }
}

showMenu();
