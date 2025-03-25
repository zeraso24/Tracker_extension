// Background script for the Task Tracker extension
// This handles notifications and alarms when the popup is closed

// Initialize alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    // Timer completed
    chrome.storage.local.get(['currentTask', 'currentGoal'], (data) => {
      if (data.currentTask && data.currentGoal) {
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../icons/icon128.png',
          title: 'Pomodoro Completed!',
          message: `You've completed a pomodoro session for: ${data.currentTask.name}`,
          buttons: [
            { title: 'Take a Break' },
            { title: 'Start Next Pomodoro' }
          ],
          priority: 2
        });

        // Update task progress
        updateTaskProgress(data.currentGoal.id, data.currentTask.id);
      }
    });
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 1) {
    // Start next pomodoro
    chrome.storage.local.get(['currentTask', 'currentGoal'], (data) => {
      if (data.currentTask && data.currentGoal) {
        startTimer(25 * 60, data.currentTask.id, data.currentGoal.id);
      }
    });
  }
});

// Update task progress when a pomodoro is completed
function updateTaskProgress(goalId, taskId) {
  chrome.storage.local.get(['goals', 'dailyStats'], (data) => {
    const goals = data.goals || [];
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex !== -1) {
      const taskIndex = goals[goalIndex].tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex !== -1) {
        const task = goals[goalIndex].tasks[taskIndex];
        task.completedPomodoros = (task.completedPomodoros || 0) + 1;
        
        // Add pomodoro to history
        task.pomodoroHistory = task.pomodoroHistory || [];
        task.pomodoroHistory.push({
          date: new Date().toISOString(),
          duration: 25 * 60, // 25 minutes in seconds
          type: 'work'
        });
        
        // Save goals
        chrome.storage.local.set({ goals });

        // Update daily stats
        const dailyStats = data.dailyStats || {};
        const today = new Date().toISOString().split('T')[0];
        
        if (!dailyStats.date || dailyStats.date !== today) {
          // Reset stats for new day
          dailyStats.date = today;
          dailyStats.completedPomodoros = 1;
          dailyStats.focusMinutes = 25;
        } else {
          // Update existing stats
          dailyStats.completedPomodoros = (dailyStats.completedPomodoros || 0) + 1;
          dailyStats.focusMinutes = (dailyStats.focusMinutes || 0) + 25;
        }
        
        chrome.storage.local.set({ dailyStats });
      }
    }
  });
}

// Start a timer
function startTimer(duration, taskId, goalId) {
  // Create an alarm that will fire after the duration
  chrome.alarms.create('pomodoroTimer', {
    delayInMinutes: duration / 60
  });
  
  // Save current task and goal
  chrome.storage.local.set({
    currentTask: { id: taskId },
    currentGoal: { id: goalId },
    timerRunning: true,
    timerEndTime: Date.now() + (duration * 1000)
  });
}

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with default values
  chrome.storage.local.get(['goals', 'dailyStats'], (data) => {
    if (!data.goals) {
      chrome.storage.local.set({ goals: [] });
    }
    
    if (!data.dailyStats) {
      const today = new Date().toISOString().split('T')[0];
      chrome.storage.local.set({
        dailyStats: {
          date: today,
          totalGoals: 0,
          completedGoals: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalPomodoros: 0,
          completedPomodoros: 0,
          focusMinutes: 0
        }
      });
    }
  });
});
