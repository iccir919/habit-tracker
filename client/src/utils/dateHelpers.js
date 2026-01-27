export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function formatDateShort(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function isSameDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return d1.toDateString() === d2.toDateString();
}

export function isToday(date) {
    return isSameDate(date, new Date());
}

export function toDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}