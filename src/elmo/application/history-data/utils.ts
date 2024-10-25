import { DateTime, Interval } from 'luxon';

export function getDataSizeOfFifteenMinuteInterval(
  startDate: Date,
  endDate: Date,
) {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const interval = Interval.fromDateTimes(start, end);
  return Math.ceil(interval.length('minutes') / 15);
}

export function getDataSizeOfOneDayInterval(startDate: Date, endDate: Date) {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const interval = Interval.fromDateTimes(start, end);
  return Math.ceil(interval.length('days'));
}

export function eachMonthOfInterval(startDate: Date, endDate: Date) {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const interval = Interval.fromDateTimes(start, end);
  return interval.splitBy({ months: 1 }).map((i) => i.start);
}

export function ensureTimeMarkIsISOFormat(timeMark: string) {
  // To ensure time_mark is in ISO format (+0) because time_mark may be another time zone, e.g., +08:00
  return DateTime.fromISO(timeMark, {
    zone: 'utc',
  }).toISO();
}

export function buildFifteenMinuteIntervalIndexNameList(
  baseIndexName: string,
  startDate: Date,
  endDate: Date,
) {
  const dates = eachMonthOfInterval(startDate, endDate);
  return dates.map((date) => `${baseIndexName}${date.toFormat('yyyy-MM')}`);
}
