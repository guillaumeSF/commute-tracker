// Utility functions for formatting data across components

export const formatCronSchedule = (cron) => {
  // Enhanced cron format display for human readability
  if (cron === '0 8 * * 1-5') return 'Weekday mornings (8 AM)';
  if (cron === '0 17 * * 1-5') return 'Weekday evenings (5 PM)';
  if (cron === '0 */2 * * *') return 'Every 2 hours';
  if (cron === '0 */4 * * *') return 'Every 4 hours';
  if (cron === '0 * * * 1-5') return 'Every hour (weekdays)';
  if (cron === '0 */30 * * *') return 'Every 30 minutes';
  if (cron === '0 */15 * * *') return 'Every 15 minutes';
  if (cron === '0 9 * * 1-5') return 'Weekday mornings (9 AM)';
  if (cron === '0 18 * * 1-5') return 'Weekday evenings (6 PM)';
  if (cron === '0 7 * * 1-5') return 'Weekday mornings (7 AM)';
  if (cron === '0 16 * * 1-5') return 'Weekday evenings (4 PM)';
  if (cron === '* * * * *') return 'Every minute';
  
  // Handle specific time daily patterns (e.g., "0 14 * * *" for 2 PM daily)
  if (cron.match(/^0 \d+ \* \* \*$/)) {
    const hour = parseInt(cron.split(' ')[1]);
    const minute = parseInt(cron.split(' ')[0]);
    if (hour < 12) {
      return `Daily at ${hour}:${minute.toString().padStart(2, '0')} AM`;
    } else {
      const pmHour = hour > 12 ? hour - 12 : 12;
      return `Daily at ${pmHour}:${minute.toString().padStart(2, '0')} PM`;
    }
  }
  
  // Handle weekday patterns
  if (cron.match(/^0 \d+ \* \* 1-5$/)) {
    const hour = cron.split(' ')[1];
    if (hour < 12) {
      return `Weekday mornings (${hour}:00 AM)`;
    } else {
      const pmHour = hour > 12 ? hour - 12 : 12;
      return `Weekday afternoons (${pmHour}:00 PM)`;
    }
  }
  
  // Handle interval patterns
  if (cron.match(/^0 \*\/\d+ \* \* \*$/)) {
    const interval = cron.split(' ')[1].replace('*/', '');
    if (interval === '30') {
      return 'Every 30 minutes';
    }
    // Check if it's a minute interval (less than 60) or hour interval
    if (parseInt(interval) < 60) {
      return `Every ${interval} minute${parseInt(interval) !== 1 ? 's' : ''}`;
    }
    return `Every ${interval} hours`;
  }
  
  // Handle new minute interval patterns (e.g., */5 * * * * for every 5 minutes)
  if (cron.match(/^\*\/\d+ \* \* \* \*$/)) {
    const interval = cron.split(' ')[0].replace('*/', '');
    return `Every ${interval} minute${parseInt(interval) !== 1 ? 's' : ''}`;
  }
  
  // Fallback for custom expressions
  return 'Custom schedule';
};

export const formatDuration = (seconds) => {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString();
};

export const getTrafficLevelColor = (level) => {
  switch (level) {
    case 'low': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'high': return '#F97316';
    case 'severe': return '#EF4444';
    default: return '#6B7280';
  }
};

export const getNextScheduledCheck = (cronExpression) => {
  if (!cronExpression) return null;
  
  try {
    // Parse cron expression: minute hour day month weekday
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return null;
    
    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();
    let nextDate = new Date(now);
    
    // Set to start of current minute
    nextDate.setSeconds(0, 0);
    
    // Handle different cron patterns
    if (weekday === '1-5') {
      // Weekday pattern (Monday-Friday)
      const currentWeekday = nextDate.getDay(); // 0=Sunday, 1=Monday, etc.
      
      if (currentWeekday === 0 || currentWeekday === 6) {
        // Weekend - move to next Monday
        const daysUntilMonday = currentWeekday === 0 ? 1 : 2;
        nextDate.setDate(nextDate.getDate() + daysUntilMonday);
      }
      
      // Set the specific hour and minute
      nextDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // If the time has passed today, move to next weekday
      if (nextDate <= now) {
        const daysToAdd = currentWeekday === 5 ? 3 : 1; // Friday -> Monday, others -> next day
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      }
    } else if (hour.startsWith('*/')) {
      // Interval pattern (e.g., */2 for every 2 hours)
      const interval = parseInt(hour.replace('*/', ''));
      nextDate.setMinutes(parseInt(minute), 0, 0);
      
      // Find next occurrence
      while (nextDate <= now) {
        nextDate.setHours(nextDate.getHours() + interval);
      }
    } else if (minute.startsWith('*/')) {
      // Minute interval pattern (e.g., */30 for every 30 minutes)
      const interval = parseInt(minute.replace('*/', ''));
      nextDate.setMinutes(Math.ceil(nextDate.getMinutes() / interval) * interval, 0, 0);
      
      // If we went past the hour, move to next hour
      if (nextDate <= now) {
        nextDate.setHours(nextDate.getHours() + 1);
        nextDate.setMinutes(0, 0, 0);
      }
    } else if (hour === '*' && minute === '0' && day === '*' && month === '*' && weekday === '*') {
      // Special case for "every hour" pattern (0 * * * *)
      nextDate.setMinutes(0, 0, 0);
      nextDate.setHours(nextDate.getHours() + 1);
    } else if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      // Special case for "every minute" pattern (* * * * *)
      nextDate.setMinutes(nextDate.getMinutes() + 1, 0, 0);
      if (nextDate.getMinutes() >= 60) {
        nextDate.setHours(nextDate.getHours() + 1);
        nextDate.setMinutes(0, 0, 0);
      }
    } else if (hour === '*' && minute.startsWith('*/') && day === '*' && month === '*' && weekday === '*') {
      // Special case for minute intervals like "0 */30 * * *" (every 30 minutes)
      const interval = parseInt(minute.replace('*/', ''));
      const currentMinutes = nextDate.getMinutes();
      const nextInterval = Math.ceil(currentMinutes / interval) * interval;
      
      if (nextInterval >= 60) {
        // Move to next hour
        nextDate.setHours(nextDate.getHours() + 1);
        nextDate.setMinutes(0, 0, 0);
      } else {
        nextDate.setMinutes(nextInterval, 0, 0);
      }
      
      // If the calculated time has passed, move to next interval
      if (nextDate <= now) {
        nextDate.setMinutes(nextDate.getMinutes() + interval, 0, 0);
        if (nextDate.getMinutes() >= 60) {
          nextDate.setHours(nextDate.getHours() + 1);
          nextDate.setMinutes(nextDate.getMinutes() - 60, 0, 0);
        }
      }
    } else if (minute.startsWith('*/') && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      // Special case for new minute interval patterns like "*/5 * * * *" (every 5 minutes)
      const interval = parseInt(minute.replace('*/', ''));
      const currentMinutes = nextDate.getMinutes();
      const nextInterval = Math.ceil(currentMinutes / interval) * interval;
      
      if (nextInterval >= 60) {
        // Move to next hour
        nextDate.setHours(nextDate.getHours() + 1);
        nextDate.setMinutes(0, 0, 0);
      } else {
        nextDate.setMinutes(nextInterval, 0, 0);
      }
      
      // If the calculated time has passed, move to next interval
      if (nextDate <= now) {
        nextDate.setMinutes(nextDate.getMinutes() + interval, 0, 0);
        if (nextDate.getMinutes() >= 60) {
          nextDate.setHours(nextDate.getHours() + 1);
          nextDate.setMinutes(nextDate.getMinutes() - 60, 0, 0);
        }
      }
    } else if (minute === '0' && hour.startsWith('*/') && day === '*' && month === '*' && weekday === '*') {
      // Special case for old custom minute intervals like "0 */15 * * *" (every 15 minutes) - backward compatibility
      const interval = parseInt(hour.replace('*/', ''));
      const currentMinutes = nextDate.getMinutes();
      const nextInterval = Math.ceil(currentMinutes / interval) * interval;
      
      if (nextInterval >= 60) {
        // Move to next hour
        nextDate.setHours(nextDate.getHours() + 1);
        nextDate.setMinutes(0, 0, 0);
      } else {
        nextDate.setMinutes(nextInterval, 0, 0);
      }
      
      // If the calculated time has passed, move to next interval
      if (nextDate <= now) {
        nextDate.setMinutes(nextDate.getMinutes() + interval, 0, 0);
        if (nextDate.getMinutes() >= 60) {
          nextDate.setHours(nextDate.getHours() + 1);
          nextDate.setMinutes(nextDate.getMinutes() - 60, 0, 0);
        }
      }
    } else {
      // Daily pattern - set specific time
      nextDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // If the time has passed today, move to tomorrow
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    }
    
    return nextDate;
  } catch (error) {
    console.error('Error calculating next scheduled check:', error);
    return null;
  }
};

export const formatNextCheck = (nextDate) => {
  if (!nextDate) return 'Not scheduled';
  
  const now = new Date();
  const diffMs = nextDate - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} from now`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m from now`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m from now`;
  } else {
    return 'Due now';
  }
};
