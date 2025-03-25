// Timer functionality for the extension
class Timer {
    constructor() {
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.isRunning = false;
        this.currentTaskId = null;
        this.currentGoalId = null;
        this.timerInterval = null;

        // DOM elements
        this.timerDisplay = document.getElementById('timer');
        this.startButton = document.querySelector('.timer-button-primary');
        this.resetButton = document.querySelector('.timer-button-secondary');
        this.currentTaskDisplay = document.getElementById('currentTask');
        this.pomodoroCountDisplay = document.getElementById('pomodoroCount');
        this.projectNameDisplay = document.querySelector('.project-name');

        // Check if timer is already running (from background)
        this.checkTimerStatus();
        this.bindEvents();
    }

    bindEvents() {
        if (this.startButton) {
            this.startButton.addEventListener('click', () => {
                if (this.isRunning) {
                    this.pauseTimer();
                } else {
                    this.resumeTimer();
                }
            });
        }

        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => this.resetTimer());
        }
    }

    checkTimerStatus() {
        chrome.storage.local.get(['timerRunning', 'timerEndTime', 'currentTask', 'currentGoal'], (data) => {
            if (data.timerRunning && data.timerEndTime) {
                const now = Date.now();
                const timeLeft = Math.max(0, Math.floor((data.timerEndTime - now) / 1000));
                
                if (timeLeft > 0) {
                    // Resume timer
                    this.timeLeft = timeLeft;
                    this.isRunning = true;
                    this.currentTaskId = data.currentTask?.id;
                    this.currentGoalId = data.currentGoal?.id;
                    
                    if (this.startButton) {
                        this.startButton.textContent = 'Pause';
                    }
                    
                    this.updateTaskInfo();
                    this.updateDisplay();
                    this.startInterval();
                }
            }
        });
    }

    startTimer(duration, taskId, goalId) {
        this.timeLeft = duration;
        this.currentTaskId = taskId;
        this.currentGoalId = goalId;
        this.isRunning = true;
        
        if (this.startButton) {
            this.startButton.textContent = 'Pause';
        }

        // Save timer state to storage
        chrome.storage.local.set({
            timerRunning: true,
            timerEndTime: Date.now() + (duration * 1000),
            currentTask: { id: taskId },
            currentGoal: { id: goalId }
        });

        // Create alarm in background
        chrome.alarms.create('pomodoroTimer', {
            delayInMinutes: duration / 60
        });

        this.updateTaskInfo();
        this.updateDisplay();
        this.startInterval();
    }

    updateTaskInfo() {
        // Get current task info
        chrome.storage.local.get(['goals'], (data) => {
            const goals = data.goals || [];
            const currentGoal = goals.find(g => g.id === this.currentGoalId);
            const currentTask = currentGoal?.tasks.find(t => t.id === this.currentTaskId);

            // Update goal name display
            if (this.projectNameDisplay && currentGoal) {
                this.projectNameDisplay.textContent = currentGoal.name;
            }

            // Update current task display
            if (this.currentTaskDisplay && currentTask) {
                this.currentTaskDisplay.textContent = currentTask.name;
            }

            // Update pomodoro count display
            if (this.pomodoroCountDisplay && currentTask) {
                this.pomodoroCountDisplay.textContent = `${currentTask.completedPomodoros || 0}/${currentTask.estimatedPomodoros} pomodoros`;
            }
        });
    }

    startInterval() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.timeLeft > 0 && this.isRunning) {
                this.timeLeft--;
                this.updateDisplay();
                
                // Update storage with current time left
                chrome.storage.local.set({
                    timerEndTime: Date.now() + (this.timeLeft * 1000)
                });
            } else if (this.timeLeft === 0) {
                this.handleTimerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        if (this.startButton) {
            this.startButton.textContent = 'Resume';
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Update storage
        chrome.storage.local.set({
            timerRunning: false
        });
        
        // Cancel alarm
        chrome.alarms.clear('pomodoroTimer');
    }

    resumeTimer() {
        if (this.timeLeft > 0) {
            this.isRunning = true;
            if (this.startButton) {
                this.startButton.textContent = 'Pause';
            }
            
            // Update storage
            chrome.storage.local.set({
                timerRunning: true,
                timerEndTime: Date.now() + (this.timeLeft * 1000)
            });
            
            // Create alarm
            chrome.alarms.create('pomodoroTimer', {
                delayInMinutes: this.timeLeft / 60
            });
            
            this.startInterval();
        }
    }

    resetTimer() {
        this.timeLeft = 25 * 60;
        this.isRunning = false;
        this.currentTaskId = null;
        this.currentGoalId = null;
        
        if (this.startButton) {
            this.startButton.textContent = 'Start';
        }

        if (this.projectNameDisplay) {
            this.projectNameDisplay.textContent = 'No goal selected';
        }

        if (this.currentTaskDisplay) {
            this.currentTaskDisplay.textContent = 'No task selected';
        }

        if (this.pomodoroCountDisplay) {
            this.pomodoroCountDisplay.textContent = '0/0 pomodoros';
        }

        this.updateDisplay();
        clearInterval(this.timerInterval);
        
        // Update storage and clear alarm
        chrome.storage.local.set({
            timerRunning: false,
            timerEndTime: null,
            currentTask: null,
            currentGoal: null
        });
        
        chrome.alarms.clear('pomodoroTimer');
    }

    updateDisplay() {
        if (this.timerDisplay) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            this.timerDisplay.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    handleTimerComplete() {
        this.isRunning = false;
        this.timeLeft = 25 * 60;
        
        if (this.startButton) {
            this.startButton.textContent = 'Start';
        }

        // Play notification sound
        this.playNotificationSound();

        // Update task progress
        if (this.currentTaskId && this.currentGoalId) {
            this.updateTaskProgress();
        }
        
        // Reset timer state in storage
        chrome.storage.local.set({
            timerRunning: false,
            timerEndTime: null
        });
        
        this.updateDisplay();
        clearInterval(this.timerInterval);
    }

    updateTaskProgress() {
        chrome.storage.local.get(['goals', 'dailyStats'], (data) => {
            const goals = data.goals || [];
            const goalIndex = goals.findIndex(g => g.id === this.currentGoalId);
            
            if (goalIndex !== -1) {
                const taskIndex = goals[goalIndex].tasks.findIndex(t => t.id === this.currentTaskId);
                
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
                    
                    // Update pomodoro count display
                    if (this.pomodoroCountDisplay) {
                        this.pomodoroCountDisplay.textContent = `${task.completedPomodoros}/${task.estimatedPomodoros} pomodoros`;
                    }
                    
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
                    
                    // Update stats display
                    if (window.goalManager) {
                        window.goalManager.calculateStats(new Date());
                    }
                }
            }
        });
    }

    playNotificationSound() {
        const audio = new Audio(chrome.runtime.getURL('sounds/timer-end.mp3'));
        audio.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    }

    showNotification() {
        chrome.storage.local.get(['goals'], (data) => {
            const goals = data.goals || [];
            const currentGoal = goals.find(g => g.id === this.currentGoalId);
            const currentTask = currentGoal?.tasks.find(t => t.id === this.currentTaskId);
            
            const taskName = currentTask ? currentTask.name : 'your task';
            
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon128.png',
                title: 'Pomodoro Completed!',
                message: `You've completed a pomodoro session for: ${taskName}`,
                buttons: [
                    { title: 'Take a Break' },
                    { title: 'Start Next Pomodoro' }
                ],
                priority: 2
            });
        });
    }
}

// Initialize timer when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.timer = new Timer();
});
