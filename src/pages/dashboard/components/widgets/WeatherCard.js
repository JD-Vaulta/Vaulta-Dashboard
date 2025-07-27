// WeatherCard.jsx using FREE API with daily precipitation processing
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

  // Function to group forecast data by day and calculate daily totals
  const processForecastByDay = (forecastList) => {
    const dailyData = {};

    forecastList.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString(); // Groups by day

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: date,
          temps: [],
          precipitation: [],
          conditions: [],
          humidity: [],
          windSpeed: [],
          pop: [],
        };
      }

      // Collect data for this day
      dailyData[dateKey].temps.push(item.main.temp);
      dailyData[dateKey].humidity.push(item.main.humidity);
      dailyData[dateKey].windSpeed.push(item.wind.speed);
      dailyData[dateKey].conditions.push(item.weather[0]);
      dailyData[dateKey].pop.push(item.pop || 0);

      // Add precipitation (3-hour amounts)
      const rainAmount = item.rain?.["3h"] || 0;
      const snowAmount = item.snow?.["3h"] || 0;
      dailyData[dateKey].precipitation.push(rainAmount + snowAmount);
    });

    // Convert to daily summaries
    return Object.values(dailyData)
      .map((day) => {
        const dayName = day.date.toLocaleDateString("en-US", {
          weekday: "short",
        });
        const totalPrecip = day.precipitation.reduce((sum, p) => sum + p, 0);
        const maxPop = Math.max(...day.pop);
        const avgHumidity = Math.round(
          day.humidity.reduce((sum, h) => sum + h, 0) / day.humidity.length
        );
        const avgWindSpeed =
          day.windSpeed.reduce((sum, w) => sum + w, 0) / day.windSpeed.length;

        // Find most common weather condition for the day
        const conditionCounts = {};
        day.conditions.forEach((condition) => {
          conditionCounts[condition.main] =
            (conditionCounts[condition.main] || 0) + 1;
        });
        const dominantCondition = Object.keys(conditionCounts).reduce((a, b) =>
          conditionCounts[a] > conditionCounts[b] ? a : b
        );

        return {
          day: dayName,
          date: day.date.getDate(),
          tempMin: Math.round(Math.min(...day.temps)),
          tempMax: Math.round(Math.max(...day.temps)),
          tempDay: Math.round(
            day.temps.reduce((sum, t) => sum + t, 0) / day.temps.length
          ),
          precip: Math.round(totalPrecip * 10) / 10, // Daily total precipitation
          precipProb: Math.round(maxPop * 100), // Max probability for the day
          condition: dominantCondition,
          description: day.conditions[0].description,
          icon: getWeatherIcon(dominantCondition),
          humidity: avgHumidity,
          windSpeed: Math.round(avgWindSpeed * 3.6), // Convert m/s to km/h
          hasRainData: totalPrecip > 0,
          hasSnowData: day.precipitation.some((p) => p > 0), // Simplified check
        };
      })
      .slice(0, 5); // Limit to 5 days
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);

        if (!API_KEY) {
          throw new Error(
            "Weather API key is not configured. Please add REACT_APP_OPENWEATHER_API to your .env file."
          );
        }

        // API endpoints - Using FREE APIs only
        const CURRENT_URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

        console.log("🌍 Fetching weather data for:", city);
        console.log("📡 Current weather URL:", CURRENT_URL);
        console.log("📡 5-day forecast URL:", FORECAST_URL);

        // Fetch current weather
        const currentResponse = await fetch(CURRENT_URL);
        if (!currentResponse.ok) {
          if (currentResponse.status === 401) {
            throw new Error("Invalid API key");
          }
          throw new Error(
            `Current weather fetch failed: ${currentResponse.status}`
          );
        }
        const currentData = await currentResponse.json();

        // Fetch 5-day forecast (FREE API)
        const forecastResponse = await fetch(FORECAST_URL);
        if (!forecastResponse.ok) {
          throw new Error(`Forecast fetch failed: ${forecastResponse.status}`);
        }
        const forecastData = await forecastResponse.json();

        console.log("🔍 CURRENT WEATHER DATA:");
        console.log(currentData);
        console.log("🔍 5-DAY FORECAST DATA:");
        console.log(forecastData);

        // Check if forecast data exists
        if (!forecastData.list || forecastData.list.length === 0) {
          throw new Error("No forecast data available");
        }

        // Extract current precipitation data
        const currentPrecipitation = {
          rain: currentData.rain?.["1h"] || 0,
          snow: currentData.snow?.["1h"] || 0,
          total:
            (currentData.rain?.["1h"] || 0) + (currentData.snow?.["1h"] || 0),
          hasData: !!(currentData.rain || currentData.snow),
        };

        // Process 3-hour forecast data into daily summaries
        const processedForecast = processForecastByDay(forecastData.list);

        console.log("📊 PROCESSED DAILY SUMMARIES:");
        processedForecast.forEach((day, index) => {
          console.log(`Day ${index} (${day.day}):`, {
            precip: day.precip,
            precipProb: day.precipProb,
            tempRange: `${day.tempMin}°C - ${day.tempMax}°C`,
            condition: day.condition,
            hasRainData: day.hasRainData,
          });
        });

        // Ensure we have at least one day of data
        if (processedForecast.length === 0) {
          throw new Error("No forecast data could be processed");
        }

        // Use today's data for current display
        const today = processedForecast[0];

        const processedData = {
          current: {
            temp: Math.round(currentData.main.temp),
            condition: currentData.weather[0].main,
            description: currentData.weather[0].description,
            humidity: currentData.main.humidity,
            windSpeed: Math.round(currentData.wind.speed * 3.6),
            icon: getWeatherIcon(currentData.weather[0].main),
            precipitation: currentPrecipitation,
            alert: false,
          },
          forecast: processedForecast,
          todayForecast: today, // Today's forecast data including precipitation
        };

        console.log("✅ FINAL PROCESSED DATA:");
        console.log(processedData);

        setWeatherData(processedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("❌ Error fetching weather data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (API_KEY) {
      fetchWeatherData();
      const interval = setInterval(fetchWeatherData, 600000); // Refresh every 10 minutes
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
        <p style={{ color: colors.error, marginBottom: "16px" }}>
          Error: {error}
        </p>
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

  // Enhanced loading checks
  if (
    !weatherData ||
    !weatherData.forecast ||
    !weatherData.todayForecast ||
    weatherData.forecast.length === 0
  ) {
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

  // Temperature chart data - showing daily temps
  const tempChartData = {
    labels: weatherData.forecast.map((item) => item.day),
    datasets: [
      {
        label: "High °C",
        data: weatherData.forecast.map((item) => item.tempMax || 0),
        borderColor: colors.primary,
        backgroundColor: colors.primary + "20",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.white,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Low °C",
        data: weatherData.forecast.map((item) => item.tempMin || 0),
        borderColor: colors.secondary,
        backgroundColor: colors.secondary + "20",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: colors.secondary,
        pointBorderColor: colors.white,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Precipitation chart data - DAILY TOTALS from 3-hour data!
  const precipChartData = {
    labels: weatherData.forecast.map((item) => item.day),
    datasets: [
      {
        label: "Precipitation (mm)",
        data: weatherData.forecast.map((item) => item.precip || 0),
        backgroundColor: weatherData.forecast.map((item) => {
          if (item.hasRainData) {
            return colors.secondary + "80"; // Solid for actual data
          } else if (item.precipProb > 50) {
            return colors.secondary + "60"; // Medium for high probability
          } else if (item.precipProb > 20) {
            return colors.secondary + "40"; // Light for medium probability
          } else {
            return colors.lightGrey + "40"; // Very light for low/no chance
          }
        }),
        borderColor: colors.secondary,
        borderWidth: 1,
        borderRadius: 4,
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

  // Precipitation chart options with enhanced tooltips
  const precipChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const dataPoint = weatherData.forecast[context.dataIndex];
            const value = context.parsed.y;

            if (value > 0) {
              return `${value} mm daily total`;
            } else if (dataPoint.precipProb > 0) {
              return `${dataPoint.precipProb}% chance of precipitation`;
            } else {
              return "No precipitation expected";
            }
          },
          afterLabel: function (context) {
            const dataPoint = weatherData.forecast[context.dataIndex];
            return [
              `Condition: ${dataPoint.description}`,
              `Humidity: ${dataPoint.humidity}%`,
            ];
          },
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max:
          Math.max(...weatherData.forecast.map((item) => item.precip || 0), 1) *
          1.2,
      },
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
          gridTemplateColumns: "repeat(3, 1fr)",
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
            Today Rain
          </p>
          <p
            style={{
              fontSize: "clamp(14px, 2.5vw, 18px)",
              fontWeight: "600",
              color:
                (weatherData.todayForecast?.precip || 0) > 0
                  ? colors.secondary
                  : colors.textLight,
              margin: 0,
            }}
          >
            {(weatherData.todayForecast?.precip || 0) > 0
              ? `${weatherData.todayForecast.precip} mm`
              : `${weatherData.todayForecast?.precipProb || 0}%`}
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
          5-Day Temperature Range
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

      {/* Precipitation Chart - NOW WITH REAL DAILY TOTALS! */}
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
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
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
            5-Day Precipitation
          </div>
          <span
            style={{
              fontSize: "clamp(8px, 1.5vw, 10px)",
              color: colors.textLight,
              fontWeight: "400",
            }}
          >
            Daily Totals (mm)
          </span>
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
          <Bar data={precipChartData} options={precipChartOptions} />
        </div>
        <p
          style={{
            fontSize: "clamp(8px, 1.4vw, 10px)",
            color: colors.textLight,
            margin: "4px 0 0 0",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Calculated from 3-hour forecast data (Free API)
        </p>
      </div>
    </div>
  );
};

export default WeatherCard;
