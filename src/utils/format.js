export const parseDate = (str) => {
  if (!str) return null;
  const dateVal = str.includes('T') ? str : str.replace(' ', 'T');
  let d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const parts = str.split(/[-/ :]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (day <= 31 && month <= 11) {
        const hour = parseInt(parts[3] || '0', 10);
        const minute = parseInt(parts[4] || '0', 10);
        const second = parseInt(parts[5] || '0', 10);
        d = new Date(year, month, day, hour, minute, second);
      }
    }
  }
  return d && !isNaN(d.getTime()) ? d : null;
};

export const formatDate = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return dateStr || '---';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime12h = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return dateStr || '---';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
};
