/**
 * Recurrence Service
 * Handles generation of recurring event instances
 */

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface EventInstance {
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
}

export interface RecurrenceConfig {
  startDate: Date;
  endDate: Date | null;
  recurrenceType: RecurrenceType;
  recurrenceEndDate: Date | null;
  recurrenceCount: number | null;
}

/**
 * Generate all event instances for a date range
 */
export function generateRecurringInstances(
  config: RecurrenceConfig,
  rangeStart: Date,
  rangeEnd: Date
): EventInstance[] {
  const instances: EventInstance[] = [];
  
  if (config.recurrenceType === 'none') {
    // Single event - only include if it falls within the range
    if (config.startDate >= rangeStart && config.startDate <= rangeEnd) {
      instances.push({
        startDate: config.startDate,
        endDate: config.endDate,
        allDay: false, // Will be set from event
      });
    }
    return instances;
  }

  let currentDate = new Date(config.startDate);
  let instanceCount = 0;
  const maxDate = config.recurrenceEndDate || rangeEnd;
  const maxCount = config.recurrenceCount || Infinity;

  while (currentDate <= maxDate && currentDate <= rangeEnd && instanceCount < maxCount) {
    // Only include instances that fall within the requested range
    if (currentDate >= rangeStart) {
      const instanceEndDate = config.endDate
        ? new Date(currentDate.getTime() + (config.endDate.getTime() - config.startDate.getTime()))
        : null;

      instances.push({
        startDate: new Date(currentDate),
        endDate: instanceEndDate,
        allDay: false, // Will be set from event
      });
      instanceCount++;
    }

    // Calculate next occurrence
    currentDate = calculateNextOccurrence(config.recurrenceType, currentDate);
    
    // Safety check to prevent infinite loops
    if (currentDate.getTime() === config.startDate.getTime()) {
      break;
    }
  }

  return instances;
}

/**
 * Calculate the next occurrence date based on recurrence type
 */
export function calculateNextOccurrence(
  recurrenceType: RecurrenceType,
  fromDate: Date
): Date {
  const nextDate = new Date(fromDate);

  switch (recurrenceType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      // Handle edge case where target day doesn't exist in next month
      if (nextDate.getDate() !== fromDate.getDate()) {
        nextDate.setDate(0); // Go to last day of previous month
      }
      break;
    
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      // Handle edge case where target day doesn't exist in next quarter
      if (nextDate.getDate() !== fromDate.getDate()) {
        nextDate.setDate(0); // Go to last day of previous month
      }
      break;
    
    case 'none':
    default:
      // No recurrence, return same date
      break;
  }

  return nextDate;
}

/**
 * Check if an event occurs on a specific date
 */
export function isEventOccurringOnDate(
  config: RecurrenceConfig,
  checkDate: Date
): boolean {
  // Normalize dates to compare only dates (ignore time)
  const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const normalizedCheckDate = normalizeDate(checkDate);
  const normalizedStartDate = normalizeDate(config.startDate);

  if (config.recurrenceType === 'none') {
    return normalizedStartDate.getTime() === normalizedCheckDate.getTime();
  }

  // Check if date is before start date
  if (normalizedCheckDate < normalizedStartDate) {
    return false;
  }

  // Check if date is after recurrence end date
  if (config.recurrenceEndDate) {
    const normalizedEndDate = normalizeDate(config.recurrenceEndDate);
    if (normalizedCheckDate > normalizedEndDate) {
      return false;
    }
  }

  // Calculate if this date matches the recurrence pattern
  let currentDate = new Date(config.startDate);
  let iterationCount = 0;
  const maxIterations = 10000; // Safety limit

  while (currentDate <= checkDate && iterationCount < maxIterations) {
    const normalizedCurrent = normalizeDate(currentDate);
    
    if (normalizedCurrent.getTime() === normalizedCheckDate.getTime()) {
      return true;
    }

    // Check recurrence count limit
    if (config.recurrenceCount && iterationCount >= config.recurrenceCount - 1) {
      break;
    }

    currentDate = calculateNextOccurrence(config.recurrenceType, currentDate);
    iterationCount++;

    // Prevent infinite loops
    if (currentDate.getTime() <= config.startDate.getTime()) {
      break;
    }
  }

  return false;
}

/**
 * Get all dates for a recurring event within a date range
 */
export function getRecurrenceDates(
  config: RecurrenceConfig,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const instances = generateRecurringInstances(config, rangeStart, rangeEnd);
  return instances.map(instance => instance.startDate);
}

