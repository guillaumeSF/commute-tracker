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
  
  // Handle more complex patterns
  if (cron.match(/^0 \d+ \* \* 1-5$/)) {
    const hour = cron.split(' ')[1];
    if (hour < 12) {
      return `Weekday mornings (${hour}:00 AM)`;
    } else {
      const pmHour = hour > 12 ? hour - 12 : 12;
      return `Weekday afternoons (${pmHour}:00 PM)`;
    }
  }
  if (cron.match(/^0 \*\/\d+ \* \* \*$/)) {
    const interval = cron.split(' ')[1].replace('*/', '');
    return `Every ${interval} hours`;
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
