import aiohttp
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("WEATHER_API_KEY")
        self.base_url = "http://api.openweathermap.org/data/2.5"
        self.cache = {}
        self.cache_duration = timedelta(minutes=30)

    async def get_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather data for location"""
        cache_key = f"{lat},{lon}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data = self.cache[cache_key]
            if datetime.now() - cached_data["timestamp"] < self.cache_duration:
                return cached_data["data"]
        
        # Fetch new data
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/weather"
                params = {
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                    "units": "metric"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Process data
                        weather_data = {
                            "temperature": data["main"]["temp"],
                            "humidity": data["main"]["humidity"],
                            "conditions": data["weather"][0]["main"],
                            "wind_speed": data["wind"]["speed"],
                            "timestamp": datetime.now().timestamp()
                        }
                        
                        # Cache data
                        self.cache[cache_key] = {
                            "data": weather_data,
                            "timestamp": datetime.now()
                        }
                        
                        return weather_data
                    else:
                        raise Exception(f"Weather API error: {response.status}")
                        
        except Exception as e:
            print(f"Error fetching weather data: {str(e)}")
            return {}

    async def get_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get weather forecast for location"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/forecast"
                params = {
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                    "units": "metric"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Process forecast data
                        forecast = []
                        for item in data["list"]:
                            forecast.append({
                                "timestamp": item["dt"],
                                "temperature": item["main"]["temp"],
                                "humidity": item["main"]["humidity"],
                                "conditions": item["weather"][0]["main"],
                                "wind_speed": item["wind"]["speed"]
                            })
                            
                        return {"forecast": forecast}
                    else:
                        raise Exception(f"Weather API error: {response.status}")
                        
        except Exception as e:
            print(f"Error fetching forecast data: {str(e)}")
            return {"forecast": []}

    def get_comfort_metrics(self, temperature: float, humidity: float) -> Dict[str, Any]:
        """Calculate comfort metrics from weather data"""
        # Heat index calculation
        if temperature > 27:
            heat_index = self._calculate_heat_index(temperature, humidity)
        else:
            heat_index = temperature

        return {
            "heat_index": heat_index,
            "comfort_level": self._get_comfort_level(temperature, humidity)
        }

    def _calculate_heat_index(self, temperature: float, humidity: float) -> float:
        """Calculate heat index using temperature and humidity"""
        c1 = -8.784695
        c2 = 1.61139411
        c3 = 2.338549
        c4 = -0.14611605
        c5 = -1.2308094 * 10**-2
        c6 = -1.6424828 * 10**-2
        c7 = 2.211732 * 10**-3
        c8 = 7.2546 * 10**-4
        c9 = -3.582 * 10**-6

        heat_index = (c1 + 
                     c2 * temperature +
                     c3 * humidity +
                     c4 * temperature * humidity +
                     c5 * temperature**2 +
                     c6 * humidity**2 +
                     c7 * temperature**2 * humidity +
                     c8 * temperature * humidity**2 +
                     c9 * temperature**2 * humidity**2)

        return round(heat_index, 1)

    def _get_comfort_level(self, temperature: float, humidity: float) -> str:
        """Determine comfort level based on temperature and humidity"""
        if temperature < 18:
            return "too_cold"
        elif temperature > 28:
            return "too_hot"
        elif humidity < 30:
            return "too_dry"
        elif humidity > 70:
            return "too_humid"
        else:
            return "comfortable"
