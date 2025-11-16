import { storage } from './localStorage';

export interface ActiveTimer {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  isRunning: boolean;
  isPaused: boolean;
  pausedDuration: number; // Total paused time in seconds
  pauseStartTime?: Date; // When the current pause started
  userId: string;
}

export interface TimerLog {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  hourlyRate: number;
  income: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

type TimerUpdateCallback = (timer: ActiveTimer | null, elapsedSeconds: number) => void;

class TimerService {
  private activeTimer: ActiveTimer | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private updateCallbacks: Set<TimerUpdateCallback> = new Set();
  private readonly UPDATE_INTERVAL = 1000; // Update every second

  constructor() {
    this.loadTimerFromStorage();
    this.startUpdateLoop();
  }

  /**
   * Load active timer from localStorage
   */
  private loadTimerFromStorage(): void {
    try {
      const allData = storage.getAll();
      const stored = (allData as any).activeTimer as ActiveTimer | undefined;
      if (stored && (stored.isRunning || stored.isPaused)) {
        // Parse dates
        stored.startTime = new Date(stored.startTime);
        if (stored.pauseStartTime) {
          stored.pauseStartTime = new Date(stored.pauseStartTime);
        }
        // Ensure pausedDuration exists for old timers
        if (typeof stored.pausedDuration === 'undefined') {
          stored.pausedDuration = 0;
        }
        if (typeof stored.isPaused === 'undefined') {
          stored.isPaused = false;
        }
        this.activeTimer = stored;
      }
    } catch (error) {
      console.error('Error loading timer from storage:', error);
    }
  }

  /**
   * Save active timer to localStorage
   */
  private saveTimerToStorage(): void {
    try {
      const data = storage.getAll();
      if (this.activeTimer) {
        (data as any).activeTimer = this.activeTimer;
      } else {
        // Remove from storage if timer is cleared
        delete (data as any).activeTimer;
      }
      storage.setAll(data);
    } catch (error) {
      console.error('Error saving timer to storage:', error);
    }
  }

  /**
   * Start the update loop that notifies subscribers
   */
  private startUpdateLoop(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      if (this.activeTimer && (this.activeTimer.isRunning || this.activeTimer.isPaused)) {
        const elapsedSeconds = this.getElapsedSeconds();
        this.notifySubscribers(elapsedSeconds);
      }
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Stop the update loop
   */
  private stopUpdateLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Calculate elapsed seconds from start time (excluding paused time)
   */
  private getElapsedSeconds(): number {
    if (!this.activeTimer) {
      return 0;
    }
    
    if (!this.activeTimer.isRunning && !this.activeTimer.isPaused) {
      return 0;
    }

    const now = new Date();
    const start = new Date(this.activeTimer.startTime);
    const totalElapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    // Subtract paused duration
    let pausedDuration = this.activeTimer.pausedDuration;
    
    // If currently paused, add the current pause time
    if (this.activeTimer.isPaused && this.activeTimer.pauseStartTime) {
      const pauseStart = new Date(this.activeTimer.pauseStartTime);
      const currentPauseDuration = Math.floor((now.getTime() - pauseStart.getTime()) / 1000);
      pausedDuration += currentPauseDuration;
    }
    
    return Math.max(0, totalElapsed - pausedDuration);
  }

  /**
   * Notify all subscribers of timer updates
   */
  private notifySubscribers(elapsedSeconds: number): void {
    this.updateCallbacks.forEach(callback => {
      callback(this.activeTimer, elapsedSeconds);
    });
  }

  /**
   * Subscribe to timer updates
   */
  subscribe(callback: TimerUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    
    // Immediately notify with current state
    if (this.activeTimer && (this.activeTimer.isRunning || this.activeTimer.isPaused)) {
      const elapsedSeconds = this.getElapsedSeconds();
      callback(this.activeTimer, elapsedSeconds);
    } else {
      callback(null, 0);
    }

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Start a new timer
   */
  startTimer(
    customerId: string,
    projectId: string,
    taskId: string | undefined,
    description: string,
    userId: string
  ): ActiveTimer {
    // Clear any existing timer (without saving as log)
    if (this.activeTimer && this.activeTimer.isRunning) {
      this.clearTimer();
    }

    const newTimer: ActiveTimer = {
      id: `timer-${Date.now()}`,
      customerId,
      projectId,
      taskId,
      description,
      startTime: new Date(),
      isRunning: true,
      isPaused: false,
      pausedDuration: 0,
      userId,
    };

    this.activeTimer = newTimer;
    this.saveTimerToStorage();
    this.notifySubscribers(0);

    return newTimer;
  }

  /**
   * Pause the current timer
   */
  pauseTimer(): boolean {
    if (!this.activeTimer || !this.activeTimer.isRunning || this.activeTimer.isPaused) {
      return false;
    }

    this.activeTimer.isRunning = false;
    this.activeTimer.isPaused = true;
    this.activeTimer.pauseStartTime = new Date();
    this.saveTimerToStorage();
    this.notifySubscribers(this.getElapsedSeconds());

    return true;
  }

  /**
   * Resume a paused timer
   */
  resumeTimer(): boolean {
    if (!this.activeTimer || !this.activeTimer.isPaused || this.activeTimer.isRunning) {
      return false;
    }

    // Accumulate the paused duration
    if (this.activeTimer.pauseStartTime) {
      const pauseStart = new Date(this.activeTimer.pauseStartTime);
      const now = new Date();
      const pauseDuration = Math.floor((now.getTime() - pauseStart.getTime()) / 1000);
      this.activeTimer.pausedDuration += pauseDuration;
    }

    this.activeTimer.isRunning = true;
    this.activeTimer.isPaused = false;
    this.activeTimer.pauseStartTime = undefined;
    this.saveTimerToStorage();
    this.notifySubscribers(this.getElapsedSeconds());

    return true;
  }

  /**
   * Stop the current timer and return the timer log
   */
  stopTimer(hourlyRate: number): TimerLog | null {
    if (!this.activeTimer || (!this.activeTimer.isRunning && !this.activeTimer.isPaused)) {
      return null;
    }

    // If paused, accumulate the current pause before stopping
    if (this.activeTimer.isPaused && this.activeTimer.pauseStartTime) {
      const pauseStart = new Date(this.activeTimer.pauseStartTime);
      const now = new Date();
      const pauseDuration = Math.floor((now.getTime() - pauseStart.getTime()) / 1000);
      this.activeTimer.pausedDuration += pauseDuration;
    }

    const endTime = new Date();
    const duration = this.getElapsedSeconds();
    const income = (duration / 3600) * hourlyRate;

    const timerLog: TimerLog = {
      id: `log-${Date.now()}`,
      customerId: this.activeTimer.customerId,
      projectId: this.activeTimer.projectId,
      taskId: this.activeTimer.taskId,
      description: this.activeTimer.description,
      startTime: new Date(this.activeTimer.startTime),
      endTime,
      duration,
      hourlyRate,
      income,
      userId: this.activeTimer.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clear active timer
    this.activeTimer = null;
    this.saveTimerToStorage();
    this.notifySubscribers(0);

    return timerLog;
  }

  /**
   * Get current active timer
   */
  getActiveTimer(): ActiveTimer | null {
    return this.activeTimer;
  }

  /**
   * Get elapsed seconds for current timer
   */
  getElapsedSecondsPublic(): number {
    return this.getElapsedSeconds();
  }

  /**
   * Update timer description
   */
  updateDescription(description: string): void {
    if (this.activeTimer) {
      this.activeTimer.description = description;
      this.saveTimerToStorage();
      this.notifySubscribers(this.getElapsedSeconds());
    }
  }

  /**
   * Clear the timer (without saving)
   */
  clearTimer(): void {
    this.activeTimer = null;
    this.saveTimerToStorage();
    this.notifySubscribers(0);
  }

  /**
   * Cleanup when service is destroyed
   */
  destroy(): void {
    this.stopUpdateLoop();
    this.updateCallbacks.clear();
  }
}

// Create singleton instance
export const timerService = new TimerService();

