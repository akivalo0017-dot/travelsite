// Task and points management utility
class TaskManager {
  constructor() {
    this.pointsRange = { min: 40, max: 60 };
    this.totalTasks = 90;
    this.tasksPerSet = 30;
  }

  // Generate random points between min and max
  generatePoints() {
    return Math.floor(Math.random() * (this.pointsRange.max - this.pointsRange.min + 1)) + this.pointsRange.min;
  }

  // Check if task is premium (admin configurable)
  isPremiumTask(currentSet, currentTask, premiumConfig) {
    if (!premiumConfig) return false;
    
    return premiumConfig.set === currentSet && 
           premiumConfig.task === currentTask;
  }

  // Calculate total expected points
  calculateExpectedPoints(completedTasks) {
    const avgPoints = (this.pointsRange.min + this.pointsRange.max) / 2;
    return Math.round(completedTasks * avgPoints);
  }

  // Check if user can withdraw
  canWithdraw(taskCount, pointBalance, withdrawalRules) {
    const rules = withdrawalRules || {};
    
    // Default rules
    const completedAllTasks = taskCount >= this.totalTasks;
    const positiveBalance = pointBalance >= 0;
    
    // Admin override
    if (rules.allowWithdrawWithoutCompletion) {
      return positiveBalance;
    }
    
    return completedAllTasks && positiveBalance;
  }

  // Get task progress
  getTaskProgress(currentSet, currentTask, completedTasks) {
    const currentSetProgress = ((currentTask - 1) / this.tasksPerSet) * 100;
    const overallProgress = (completedTasks / this.totalTasks) * 100;
    
    return {
      currentSet: currentSet,
      currentTask: currentTask,
      completedTasks: completedTasks,
      currentSetProgress: Math.round(currentSetProgress),
      overallProgress: Math.round(overallProgress),
      remainingTasks: this.totalTasks - completedTasks
    };
  }
}

export default new TaskManager();