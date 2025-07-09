// WeatherCard.jsx
import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// NO NEED TO IMPORT DOTENV - Create React App handles this automatically

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const WeatherCard = ({ city, containerRef }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get API key from environment variable
  // Must start with REACT_APP_ for Create React App
  const API_KEY = process.env.REACT_APP_OPENWEATHER_API;

  // Debug: Check if API key is loaded
  useEffect(() => {
    console.log("API Key loaded:", API_KEY ? "Yes" : "No");
    if (!API_KEY) {
      console.error("Please add REACT_APP_OPENWEATHER_API to your .env file");
    }
  }, [API_KEY]);

  // Color scheme
  const colors = {
    primary: "#818181",
    secondary: "#c0c0c0",
    accentGreen: "#4CAF50",
    accentRed: "#F44336",
    accentBlue: "#2196F3",
    background: "rgba(192, 192, 192, 0.1)",
    textDark: "#333333",
    textLight: "#555555",
    highlight: "#FFC107",
  };

  // Function to get weather icon based on condition
  const getWeatherIcon = (condition) => {
    const iconMap = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Fog: "🌫️",
      Haze: "🌫️",
    };
    return iconMap[condition] || "☁️";
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);

        // Check if API key is available
        if (!API_KEY) {
          throw new Error(
            "Weather API key is not configured. Please add REACT_APP_OPENWEATHER_API to your .env file."
          );
        }

        // API endpoints
        const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

        // Fetch current weather
        const currentResponse = await fetch(API_URL);
        if (!currentResponse.ok) {
          if (currentResponse.status === 401) {
            throw new Error("Invalid API key");
          }
          throw new Error("Weather data fetch failed");
        }
        const currentData = await currentResponse.json();

        // Fetch forecast
        const forecastResponse = await fetch(FORECAST_URL);
        if (!forecastResponse.ok) throw new Error("Forecast data fetch failed");
        const forecastData = await forecastResponse.json();

        // Process the data
        const processedData = {
          current: {
            temp: Math.round(currentData.main.temp),
            condition: currentData.weather[0].main,
            humidity: currentData.main.humidity,
            windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
            icon: getWeatherIcon(currentData.weather[0].main),
            alert: false,
          },
          forecast: forecastData.list.slice(0, 8).map((item) => {
            const date = new Date(item.dt * 1000);
            const hours = date.getHours();
            const period = hours >= 12 ? "PM" : "AM";
            const displayHour = hours % 12 || 12;

            return {
              hour: `${displayHour}${period}`,
              temp: Math.round(item.main.temp),
              precip: Math.round((item.pop || 0) * 100),
            };
          }),
        };

        setWeatherData(processedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching weather data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (API_KEY) {
      fetchWeatherData();

      // Refresh every 10 minutes
      const interval = setInterval(fetchWeatherData, 600000);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setError("No API key configured");
    }
  }, [city, API_KEY]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading weather data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: colors.accentRed }}>Error: {error}</p>
        {!API_KEY && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <p>To fix this:</p>
            <ol style={{ textAlign: "left" }}>
              <li>Create a .env file in your project root</li>
              <li>Add: REACT_APP_OPENWEATHER_API=your-api-key</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  // No data state
  if (!weatherData) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>No weather data available</p>
      </div>
    );
  }

  // Temperature chart data
  const tempChartData = {
    labels: weatherData.forecast.map((item) => item.hour),
    datasets: [
      {
        label: "Temperature (°C)",
        data: weatherData.forecast.map((item) => item.temp),
        borderColor: colors.primary,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(55, 58, 55, 0.3)");
          gradient.addColorStop(0.5, "rgba(156, 154, 148, 0.3)");
          gradient.addColorStop(1, "rgba(220, 212, 211, 0.3)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: colors.primary,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Precipitation chart data
  const precipChartData = {
    labels: weatherData.forecast.map((item) => item.hour),
    datasets: [
      {
        label: "Precipitation (%)",
        data: weatherData.forecast.map((item) => item.precip),
        backgroundColor: colors.secondary,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: colors.primary,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: colors.textDark,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: colors.textLight,
          font: {
            weight: "500",
          },
        },
      },
      y: {
        grid: {
          color: colors.background,
          drawBorder: false,
        },
        ticks: {
          color: colors.textLight,
          font: {
            weight: "500",
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${colors.primary}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Current Weather Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: `1px solid ${colors.secondary}`,
          paddingBottom: "15px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              color: colors.textDark,
              margin: 0,
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {city} Weather
          </h2>
          <p
            style={{
              fontSize: "0.95rem",
              color: colors.textLight,
              margin: "8px 0 0 0",
              display: "flex",
              alignItems: "center",
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "2.8rem",
              marginRight: "12px",
              color: colors.highlight,
            }}
          >
            {weatherData.current.icon}
          </span>
          <div>
            <span
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: colors.textDark,
              }}
            >
              {weatherData.current.temp}°C
            </span>
            <p
              style={{
                fontSize: "0.95rem",
                color: colors.textLight,
                margin: 0,
                textAlign: "right",
                fontWeight: "500",
              }}
            >
              {weatherData.current.condition}
            </p>
          </div>
        </div>
      </div>

      {/* Weather Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: colors.background,
            borderRadius: "10px",
            padding: "14px",
            textAlign: "center",
            border: `1px solid ${colors.secondary}`,
            transition: "all 0.3s ease",
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              color: colors.textLight,
              margin: "0 0 8px 0",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Humidity
          </p>
          <p
            style={{
              fontSize: "1.4rem",
              fontWeight: "700",
              color: colors.textLight,
              margin: 0,
              textShadow: `0 2px 4px ${colors.secondary}`,
            }}
          >
            {weatherData.current.humidity}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: colors.background,
            borderRadius: "10px",
            padding: "14px",
            textAlign: "center",
            border: `1px solid ${colors.secondary}`,
            transition: "all 0.3s ease",
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              color: colors.textLight,
              margin: "0 0 8px 0",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Wind Speed
          </p>
          <p
            style={{
              fontSize: "1.4rem",
              fontWeight: "700",
              color: colors.textLight,
              margin: 0,
              textShadow: `0 2px 4px ${colors.secondary}`,
            }}
          >
            {weatherData.current.windSpeed} km/h
          </p>
        </div>
      </div>

      {/* Temperature Chart */}
      <div
        style={{
          flex: 1,
          marginBottom: "20px",
          minHeight: "180px",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "700",
            color: colors.textDark,
            margin: "0 0 12px 0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              backgroundColor: colors.primary,
              marginRight: "10px",
              borderRadius: "3px",
            }}
          ></span>
          Temperature Forecast
        </h3>
        <div
          style={{
            height: "calc(100% - 30px)",
            padding: "8px",
            borderRadius: "8px",
            backgroundColor: "rgba(255,255,255,0.7)",
            border: `1px solid ${colors.secondary}`,
          }}
        >
          <Line data={tempChartData} options={chartOptions} />
        </div>
      </div>

      {/* Precipitation Chart */}
      <div
        style={{
          flex: 1,
          minHeight: "180px",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "700",
            color: colors.textDark,
            margin: "0 0 12px 0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              backgroundColor: colors.primary,
              marginRight: "10px",
              borderRadius: "3px",
            }}
          ></span>
          Precipitation Probability
        </h3>
        <div
          style={{
            height: "calc(100% - 30px)",
            padding: "8px",
            borderRadius: "8px",
            backgroundColor: "rgba(255,255,255,0.7)",
            border: `1px solid ${colors.secondary}`,
          }}
        >
          <Bar
            data={precipChartData}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  max: 100,
                  min: 0,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
