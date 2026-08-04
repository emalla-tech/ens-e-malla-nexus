export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function isToday(value: string) {
  const today = new Date().toISOString().slice(0, 10);
  return value === today;
}

export function isPastDue(value: string) {
  const today = new Date().toISOString().slice(0, 10);
  return value < today;
}
