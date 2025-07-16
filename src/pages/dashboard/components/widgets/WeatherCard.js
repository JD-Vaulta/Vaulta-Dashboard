// Updated WeatherCard.jsx with responsive design and professional color scheme
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

const WeatherCard = ({ city, colors, isMobile, containerRef }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get API key from environment variable
  const API_KEY = process.env.REACT_APP_OPENWEATHER_API;

  // Debug: Check if API key is loaded
  useEffect(() => {
    console.log("API Key loaded:", API_KEY ? "Yes" : "No");
    if (!API_KEY) {
      console.error("Please add REACT_APP_OPENWEATHER_API to your .env file");
    }
  }, [API_KEY]);

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
          backgroundColor: colors.white,
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: colors.textLight }}>Loading weather data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: colors.error, marginBottom: "16px" }}>Error: {error}</p>
        {!API_KEY && (
          <div style={{ textAlign: "center", fontSize: "14px" }}>
            <p>To fix this:</p>
            <ol style={{ textAlign: "left", paddingLeft: "20px" }}>
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
          backgroundColor: colors.white,
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: colors.textLight }}>No weather data available</p>
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
          gradient.addColorStop(0, colors.primary + "30");
          gradient.addColorStop(1, colors.primary + "05");
          return gradient;
        },
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.white,
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
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
        backgroundColor: colors.secondary + "60",
        borderColor: colors.secondary,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: colors.secondary + "80",
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
        backgroundColor: colors.white,
        titleColor: colors.textDark,
        bodyColor: colors.textDark,
        borderColor: colors.lightGrey,
        borderWidth: 1,
        titleFont: {
          size: 10,
          weight: "600",
        },
        bodyFont: {
          size: 9,
        },
        padding: 6,
        usePointStyle: true,
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
            size: 9,
            weight: "500",
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: colors.lightGrey + "50",
          drawBorder: false,
        },
        ticks: {
          color: colors.textLight,
          font: {
            size: 9,
            weight: "500",
          },
          maxTicksLimit: 4,
        },
      },
    },
    layout: {
      padding: 0,
    },
  };

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: "6px",
        padding: "clamp(10px, 2vw, 16px)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        height: "100%",
        maxHeight: "600px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "auto",
      }}
    >
      {/* Current Weather Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "clamp(8px, 1.5vw, 16px)",
          paddingBottom: "clamp(8px, 1.5vw, 12px)",
          borderBottom: `1px solid ${colors.lightGrey}`,
          height: "50px",
          maxHeight: "60px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "clamp(14px, 2.5vw, 18px)",
              fontWeight: "600",
              color: colors.textDark,
              margin: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {city} Weather
          </h2>
          <p
            style={{
              fontSize: "clamp(10px, 1.8vw, 12px)",
              color: colors.textLight,
              margin: "2px 0 0 0",
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
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
              fontSize: "clamp(24px, 4vw, 32px)",
              marginRight: "6px",
            }}
          >
            {weatherData.current.icon}
          </span>
          <div>
            <span
              style={{
                fontSize: "clamp(18px, 3vw, 24px)",
                fontWeight: "600",
                color: colors.textDark,
              }}
            >
              {weatherData.current.temp}°C
            </span>
            <p
              style={{
                fontSize: "clamp(10px, 1.8vw, 12px)",
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
          gap: "clamp(6px, 1vw, 12px)",
          marginBottom: "clamp(8px, 1.5vw, 16px)",
          height: "60px",
          maxHeight: "70px",
        }}
      >
        <div
          style={{
            backgroundColor: colors.background,
            borderRadius: "4px",
            padding: "clamp(6px, 1vw, 10px)",
            textAlign: "center",
            border: `1px solid ${colors.lightGrey}`,
          }}
        >
          <p
            style={{
              fontSize: "clamp(9px, 1.5vw, 11px)",
              color: colors.textLight,
              margin: "0 0 2px 0",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Humidity
          </p>
          <p
            style={{
              fontSize: "clamp(14px, 2.5vw, 18px)",
              fontWeight: "600",
              color: colors.primary,
              margin: 0,
            }}
          >
            {weatherData.current.humidity}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: colors.background,
            borderRadius: "4px",
            padding: "clamp(6px, 1vw, 10px)",
            textAlign: "center",
            border: `1px solid ${colors.lightGrey}`,
          }}
        >
          <p
            style={{
              fontSize: "clamp(9px, 1.5vw, 11px)",
              color: colors.textLight,
              margin: "0 0 2px 0",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Wind
          </p>
          <p
            style={{
              fontSize: "clamp(14px, 2.5vw, 18px)",
              fontWeight: "600",
              color: colors.primary,
              margin: 0,
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
          marginBottom: "clamp(6px, 1vw, 12px)",
          minHeight: "80px",
        }}
      >
        <h3
          style={{
            fontSize: "clamp(11px, 2vw, 14px)",
            fontWeight: "600",
            color: colors.textDark,
            margin: "0 0 6px 0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              backgroundColor: colors.primary,
              marginRight: "6px",
              borderRadius: "2px",
            }}
          ></span>
          Temperature
        </h3>
        <div
          style={{
            height: "calc(100% - 20px)",
            padding: "4px",
            borderRadius: "4px",
            backgroundColor: colors.background,
            border: `1px solid ${colors.lightGrey}`,
          }}
        >
          <Line data={tempChartData} options={chartOptions} />
        </div>
      </div>

      {/* Precipitation Chart */}
      <div
        style={{
          flex: 1,
          minHeight: "80px",
        }}
      >
        <h3
          style={{
            fontSize: "clamp(11px, 2vw, 14px)",
            fontWeight: "600",
            color: colors.textDark,
            margin: "0 0 6px 0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              backgroundColor: colors.secondary,
              marginRight: "6px",
              borderRadius: "2px",
            }}
          ></span>
          Precipitation
        </h3>
        <div
          style={{
            height: "calc(100% - 20px)",
            padding: "4px",
            borderRadius: "4px",
            backgroundColor: colors.background,
            border: `1px solid ${colors.lightGrey}`,
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