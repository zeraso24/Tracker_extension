# Personal Task Tracker Extension

A browser extension version of the Personal Task Tracker with Pomodoro timer functionality.

## Features

### Task Management
- Create and manage goals with multiple tasks
- Track task completion status
- Estimate and track pomodoro sessions per task
- Delete tasks and goals
- Real-time UI updates
- Persistent storage using Chrome's storage API

### Timer Functionality
- 25-minute Pomodoro timer
- Visual and audio notifications
- Track pomodoro completion per task
- Dynamic goal and task display while timer is running
- Start, pause, and reset functionality
- Background timer tracking (continues when popup is closed)

### UI Features
- Clean, modern interface
- Dynamic header showing current goal in progress
- Progress tracking for daily tasks
- Responsive design
- Hoefler font for headers
- Inter font for timer display

## Installation

### Chrome/Edge/Brave
1. Download or clone this repository
2. Open your browser and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `task-tracker-extension` folder
5. The extension should now be installed and visible in your browser toolbar

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select any file in the `task-tracker-extension` folder
5. The extension should now be installed and visible in your browser toolbar

## Usage

1. Click the extension icon in your browser toolbar to open the Task Tracker
2. Add your goals using the "Add Goal" button
3. Create tasks within each goal
4. Set estimated pomodoros for each task
5. Click "Start Pomodoro" on any task to begin working
6. Timer will track your progress and update completion status
7. You'll receive notifications when your pomodoro session is complete

The extension automatically saves all progress to Chrome's storage.

## Weather Integration

The extension includes weather information in the header. To enable this feature:
1. Get an API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Open the `js/weather.js` file
3. Replace `YOUR_API_KEY` with your actual API key

## Customization

You can customize timer settings by clicking the settings icon in the top-right corner:
- Pomodoro Length: Set the duration of your work sessions (default: 25 minutes)
- Short Break Length: Set the duration of your short breaks (default: 5 minutes)
- Notifications: Enable or disable browser notifications

## Privacy

This extension stores all data locally in your browser. No data is sent to external servers except for the weather API if enabled.

## Credits

- Icons: Created using SVG paths
- Fonts: Inter (Google Fonts) and Hoefler Text
- Styling: Tailwind CSS
