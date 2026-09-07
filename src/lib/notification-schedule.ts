export function notificationWindow(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const hour = Number(get('hour'));
  const period =
    hour === 8
      ? 'morning'
      : hour === 13
        ? 'afternoon'
        : hour === 19
          ? 'evening'
          : null;
  return period
    ? { period, localDate: `${get('year')}-${get('month')}-${get('day')}` }
    : null;
}
