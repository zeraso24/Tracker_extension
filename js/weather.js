// Weather functionality for the extension
const weather = {
    apiKey: 'YOUR_API_KEY', // Replace with your actual API key
    
    init: function() {
        this.weatherDisplay = document.querySelector('.weather-display');
        if (this.weatherDisplay) {
            this.getWeather();
            
            // Update weather every 30 minutes
            setInterval(() => this.getWeather(), 30 * 60 * 1000);
        }
    },
    
    getWeather: function() {
        // Check if we have cached weather data
        chrome.storage.local.get(['weatherData', 'weatherTimestamp'], (data) => {
            const now = Date.now();
            const weatherData = data.weatherData;
            const weatherTimestamp = data.weatherTimestamp || 0;
            
            // If we have cached data less than 30 minutes old, use it
            if (weatherData && (now - weatherTimestamp < 30 * 60 * 1000)) {
                this.displayWeather(weatherData);
                return;
            }
            
            // Otherwise, get user's location and fetch new weather data
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    this.fetchWeather(lat, lon);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    this.weatherDisplay.textContent = '';
                }
            );
        });
    },
    
    fetchWeather: function(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Weather API error');
                }
                return response.json();
            })
            .then(data => {
                // Cache the weather data
                chrome.storage.local.set({
                    weatherData: data,
                    weatherTimestamp: Date.now()
                });
                
                this.displayWeather(data);
            })
            .catch(error => {
                console.error('Error fetching weather:', error);
                this.weatherDisplay.textContent = '';
            });
    },
    
    displayWeather: function(data) {
        if (!this.weatherDisplay) return;
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const icon = data.weather[0].icon;
        
        this.weatherDisplay.innerHTML = `
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" width="24" height="24">
            <span>${temp}°C</span>
        `;
    }
};

// Initialize weather when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    weather.init();
});
