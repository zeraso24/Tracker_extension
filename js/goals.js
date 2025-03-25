// Goals management functionality for the extension
class GoalManager {
    constructor() {
        this.goals = [];
        this.loadGoals();
        this.bindEvents();
    }

    bindEvents() {
        // Bind form submit events
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'addGoalForm') {
                e.preventDefault();
                this.handleAddGoal(e);
            } else if (e.target.id === 'addTaskForm') {
                e.preventDefault();
                this.handleAddTask(e);
            }
        });

        // Initialize event listeners for dynamic elements
        this.initializeEventListeners();

        // Initialize date picker
        const datePicker = document.getElementById('datePickerInput');
        if (datePicker) {
            // Set max date to today
            const today = new Date().toISOString().split('T')[0];
            datePicker.value = today;
            datePicker.max = today;
            
            // Add change event listener
            datePicker.addEventListener('change', (e) => {
                const selectedDate = new Date(e.target.value);
                this.calculateStats(selectedDate);
                this.updateDateDisplay(selectedDate);
            });

            // Initial stats calculation
            this.calculateStats(new Date(today));
            this.updateDateDisplay(new Date(today));
        }
    }

    initializeEventListeners() {
        // Add Goal button
        const addGoalBtn = document.querySelector('.add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                utils.modal.open('addGoalModal');
            });
        }

        // Calendar button
        const calendarBtn = document.getElementById('calendarBtn');
        const datePickerPopup = document.querySelector('.date-picker-popup');
        const datePickerInput = document.getElementById('datePickerInput');
        
        if (calendarBtn && datePickerPopup && datePickerInput) {
            // Set initial date
            const today = new Date().toISOString().split('T')[0];
            datePickerInput.value = today;
            this.updateDateDisplay(new Date());

            // Toggle calendar on button click
            calendarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                datePickerPopup.classList.toggle('show');
            });

            // Handle date selection
            datePickerInput.addEventListener('change', (e) => {
                const selectedDate = new Date(e.target.value);
                this.updateDateDisplay(selectedDate);
                this.calculateStats(selectedDate);
                datePickerPopup.classList.remove('show');
            });

            // Close popup when clicking outside
            document.addEventListener('click', (e) => {
                if (!datePickerPopup.contains(e.target) && !calendarBtn.contains(e.target)) {
                    datePickerPopup.classList.remove('show');
                }
            });
        }

        // Event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            // Add task button
            if (e.target.closest('.add-task-btn')) {
                const goalContainer = e.target.closest('.goal-container');
                const goalId = goalContainer.getAttribute('data-goal-id');
                const modal = document.getElementById('addTaskModal');
                modal.setAttribute('data-goal-id', goalId);
                utils.modal.open('addTaskModal');
            }
            
            // Delete goal button
            else if (e.target.closest('.delete-goal-btn')) {
                const goalContainer = e.target.closest('.goal-container');
                const goalId = goalContainer.getAttribute('data-goal-id');
                this.deleteGoal(goalId);
            }
            
            // Delete task button
            else if (e.target.closest('.delete-task-btn')) {
                const taskContainer = e.target.closest('.task-container');
                const goalId = taskContainer.getAttribute('data-goal-id');
                const taskId = taskContainer.getAttribute('data-task-id');
                this.deleteTask(goalId, taskId);
            }
            
            // Task checkbox
            else if (e.target.closest('.task-checkbox')) {
                const taskContainer = e.target.closest('.task-container');
                const goalId = taskContainer.getAttribute('data-goal-id');
                const taskId = taskContainer.getAttribute('data-task-id');
                this.toggleTaskCompletion(goalId, taskId);
            }
            
            // Start pomodoro button
            else if (e.target.closest('.start-pomodoro-btn')) {
                const taskContainer = e.target.closest('.task-container');
                const goalId = taskContainer.getAttribute('data-goal-id');
                const taskId = taskContainer.getAttribute('data-task-id');
                this.startPomodoro(goalId, taskId);
            }
        });
    }

    updateDateDisplay(date) {
        const dateDisplay = document.querySelector('.date');
        if (dateDisplay) {
            dateDisplay.textContent = utils.formatDate(date);
        }
    }

    async loadGoals() {
        try {
            // Load goals from Chrome storage
            const goals = await utils.storage.get('goals');
            this.goals = Array.isArray(goals) ? goals : [];
            
            // Render goals and calculate stats
            this.renderGoals();
            this.calculateStats(new Date());
        } catch (error) {
            console.error('Error loading goals:', error);
            utils.notify('Error loading goals. Please try refreshing the extension.', 'error');
        }
    }

    saveGoals() {
        utils.storage.set('goals', this.goals);
        
        // Update total counts in daily stats
        const today = new Date().toISOString().split('T')[0];
        utils.storage.get('dailyStats', (dailyStats) => {
            dailyStats = dailyStats || {
                date: today,
                totalGoals: 0,
                completedGoals: 0,
                totalTasks: 0,
                completedTasks: 0,
                totalPomodoros: 0,
                completedPomodoros: 0,
                focusMinutes: 0
            };

            if (dailyStats.date === today) {
                let totalTasks = 0;
                let totalPomodoros = 0;
                
                this.goals.forEach(goal => {
                    if (goal.tasks) {
                        totalTasks += goal.tasks.length;
                        goal.tasks.forEach(task => {
                            totalPomodoros += task.estimatedPomodoros || 0;
                        });
                    }
                });

                dailyStats.totalTasks = totalTasks;
                dailyStats.totalPomodoros = totalPomodoros;
                dailyStats.totalGoals = this.goals.length;
                
                utils.storage.set('dailyStats', dailyStats);
                this.calculateStats(new Date());
            }
        });
    }

    handleAddGoal(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('#goalName').value.trim();

        if (!name) {
            utils.notify('Please enter a goal name', 'error');
            return;
        }

        const newGoal = {
            id: utils.generateId(),
            name,
            tasks: [],
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.goals.push(newGoal);
        this.saveGoals();
        this.renderGoals();
        this.calculateStats(new Date());
        
        utils.modal.close('addGoalModal');
        utils.notify('Goal added successfully!', 'success');

        // Clear form
        form.reset();
    }

    handleAddTask(e) {
        e.preventDefault();
        const form = e.target;
        const modal = document.getElementById('addTaskModal');
        const goalId = modal.getAttribute('data-goal-id');
        const name = form.querySelector('#taskName').value.trim();
        const estimatedPomodoros = parseInt(form.querySelector('#estimatedPomodoros').value) || 1;

        if (!name) {
            utils.notify('Please enter a task name', 'error');
            return;
        }

        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) {
            utils.notify('Goal not found', 'error');
            return;
        }

        const newTask = {
            id: utils.generateId(),
            name,
            estimatedPomodoros,
            completedPomodoros: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            pomodoroHistory: []
        };

        this.goals[goalIndex].tasks.push(newTask);
        this.saveGoals();
        this.renderGoals();
        this.calculateStats(new Date());
        
        utils.modal.close('addTaskModal');
        utils.notify('Task added successfully!', 'success');

        // Clear form
        form.reset();
    }

    deleteGoal(goalId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
            this.goals.splice(goalIndex, 1);
            this.saveGoals();
            this.renderGoals();
            this.calculateStats(new Date());
            utils.notify('Goal deleted successfully', 'success');
        }
    }

    deleteTask(goalId, taskId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
            const taskIndex = this.goals[goalIndex].tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                this.goals[goalIndex].tasks.splice(taskIndex, 1);
                this.saveGoals();
                this.renderGoals();
                this.calculateStats(new Date());
                utils.notify('Task deleted successfully', 'success');
            }
        }
    }

    toggleTaskCompletion(goalId, taskId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
            const taskIndex = this.goals[goalIndex].tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                const task = this.goals[goalIndex].tasks[taskIndex];
                task.completed = !task.completed;
                
                if (task.completed) {
                    task.completionDate = new Date().toISOString();
                } else {
                    task.completionDate = null;
                }
                
                this.saveGoals();
                this.renderGoals();
                this.calculateStats(new Date());
            }
        }
    }

    startPomodoro(goalId, taskId) {
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
            const taskIndex = this.goals[goalIndex].tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                const task = this.goals[goalIndex].tasks[taskIndex];
                const goal = this.goals[goalIndex];
                
                // Start timer
                window.timer.startTimer(25 * 60, taskId, goalId);
                
                // Update project name display
                const projectNameDisplay = document.querySelector('.project-name');
                if (projectNameDisplay) {
                    projectNameDisplay.textContent = goal.name;
                }
                
                utils.notify(`Started pomodoro for: ${task.name}`, 'success');
            }
        }
    }

    renderGoals() {
        const goalsList = document.querySelector('.goals-list');
        if (!goalsList) return;
        
        // Clear existing goals
        goalsList.innerHTML = '';
        
        if (this.goals.length === 0) {
            goalsList.innerHTML = '<div class="p-4 text-center text-gray-500">No goals yet. Add your first goal to get started!</div>';
            return;
        }
        
        // Sort goals by creation date (newest first)
        const sortedGoals = [...this.goals].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Render each goal
        sortedGoals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-container';
            goalElement.setAttribute('data-goal-id', goal.id);
            
            // Goal header
            const goalHeader = document.createElement('div');
            goalHeader.className = 'goal-header';
            
            const goalTitle = document.createElement('h3');
            goalTitle.className = 'goal-title';
            goalTitle.textContent = goal.name;
            
            const goalActions = document.createElement('div');
            goalActions.className = 'goal-actions';
            
            const addTaskBtn = document.createElement('button');
            addTaskBtn.className = 'goal-action-btn add-task-btn';
            addTaskBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="#71717A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            addTaskBtn.title = 'Add Task';
            
            const deleteGoalBtn = document.createElement('button');
            deleteGoalBtn.className = 'goal-action-btn delete-goal-btn';
            deleteGoalBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="#71717A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            deleteGoalBtn.title = 'Delete Goal';
            
            goalActions.appendChild(addTaskBtn);
            goalActions.appendChild(deleteGoalBtn);
            
            goalHeader.appendChild(goalTitle);
            goalHeader.appendChild(goalActions);
            
            goalElement.appendChild(goalHeader);
            
            // Tasks
            if (goal.tasks && goal.tasks.length > 0) {
                const tasksContainer = document.createElement('div');
                tasksContainer.className = 'tasks-container';
                
                // Sort tasks by completion status and creation date
                const sortedTasks = [...goal.tasks].sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
                sortedTasks.forEach(task => {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'task-container';
                    taskElement.setAttribute('data-goal-id', goal.id);
                    taskElement.setAttribute('data-task-id', task.id);
                    
                    const taskLeft = document.createElement('div');
                    taskLeft.className = 'task-left';
                    
                    const taskCheckbox = document.createElement('div');
                    taskCheckbox.className = `task-checkbox ${task.completed ? 'completed' : ''}`;
                    if (task.completed) {
                        taskCheckbox.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12L10 17L19 8" stroke="#507A37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    }
                    
                    const taskInfo = document.createElement('div');
                    taskInfo.className = 'task-info';
                    
                    const taskName = document.createElement('div');
                    taskName.className = `task-name ${task.completed ? 'completed' : ''}`;
                    taskName.textContent = task.name;
                    
                    const taskPomodoros = document.createElement('div');
                    taskPomodoros.className = 'task-pomodoros';
                    taskPomodoros.textContent = `${task.completedPomodoros || 0}/${task.estimatedPomodoros} pomodoros`;
                    
                    taskInfo.appendChild(taskName);
                    taskInfo.appendChild(taskPomodoros);
                    
                    taskLeft.appendChild(taskCheckbox);
                    taskLeft.appendChild(taskInfo);
                    
                    const taskActions = document.createElement('div');
                    taskActions.className = 'task-actions';
                    
                    const startPomodoroBtn = document.createElement('button');
                    startPomodoroBtn.className = 'task-action-btn start-pomodoro-btn';
                    startPomodoroBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#71717A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 8L16 12L10 16V8Z" fill="#71717A"/></svg>';
                    startPomodoroBtn.title = 'Start Pomodoro';
                    
                    const deleteTaskBtn = document.createElement('button');
                    deleteTaskBtn.className = 'task-action-btn delete-task-btn';
                    deleteTaskBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="#71717A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    deleteTaskBtn.title = 'Delete Task';
                    
                    taskActions.appendChild(startPomodoroBtn);
                    taskActions.appendChild(deleteTaskBtn);
                    
                    taskElement.appendChild(taskLeft);
                    taskElement.appendChild(taskActions);
                    
                    tasksContainer.appendChild(taskElement);
                });
                
                goalElement.appendChild(tasksContainer);
            } else {
                const emptyTasks = document.createElement('div');
                emptyTasks.className = 'p-4 text-center text-gray-500';
                emptyTasks.textContent = 'No tasks yet. Add your first task to get started!';
                goalElement.appendChild(emptyTasks);
            }
            
            goalsList.appendChild(goalElement);
        });
    }

    calculateStats(date) {
        const dateString = date.toISOString().split('T')[0];
        
        // Get stats elements
        const totalGoalsElement = document.getElementById('totalGoals');
        const completedGoalsElement = document.getElementById('completedGoals');
        const totalTasksElement = document.getElementById('totalTasks');
        const completedTasksElement = document.getElementById('completedTasks');
        const totalPomodorosElement = document.getElementById('totalPomodoros');
        const completedPomodorosElement = document.getElementById('completedPomodoros');
        const focusMinutesElement = document.getElementById('focusMinutes');
        
        // Calculate stats
        let totalGoals = this.goals.length;
        let completedGoals = this.goals.filter(goal => goal.completed).length;
        let totalTasks = 0;
        let completedTasks = 0;
        let totalPomodoros = 0;
        let completedPomodoros = 0;
        
        this.goals.forEach(goal => {
            if (goal.tasks) {
                totalTasks += goal.tasks.length;
                completedTasks += goal.tasks.filter(task => task.completed).length;
                
                goal.tasks.forEach(task => {
                    totalPomodoros += task.estimatedPomodoros || 0;
                    completedPomodoros += task.completedPomodoros || 0;
                });
            }
        });
        
        // Get focus minutes from daily stats
        utils.storage.get('dailyStats', (dailyStats) => {
            let focusMinutes = 0;
            
            if (dailyStats && dailyStats.date === dateString) {
                focusMinutes = dailyStats.focusMinutes || 0;
            }
            
            // Update stats display
            if (totalGoalsElement) totalGoalsElement.textContent = totalGoals;
            if (completedGoalsElement) completedGoalsElement.textContent = completedGoals;
            if (totalTasksElement) totalTasksElement.textContent = totalTasks;
            if (completedTasksElement) completedTasksElement.textContent = completedTasks;
            if (totalPomodorosElement) totalPomodorosElement.textContent = totalPomodoros;
            if (completedPomodorosElement) completedPomodorosElement.textContent = completedPomodoros;
            if (focusMinutesElement) focusMinutesElement.textContent = focusMinutes;
            
            // Save daily stats
            const updatedStats = {
                date: dateString,
                totalGoals,
                completedGoals,
                totalTasks,
                completedTasks,
                totalPomodoros,
                completedPomodoros,
                focusMinutes
            };
            
            utils.storage.set('dailyStats', updatedStats);
        });
    }
}

// Initialize goal manager
document.addEventListener('DOMContentLoaded', () => {
    window.goalManager = new GoalManager();
});
