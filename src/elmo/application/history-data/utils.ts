import { DateTime, Interval } from 'luxon';

export const FIFTEEN_MINUTES = 15;
export const ONE_HOUR = 60;

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

export function fillMissingDataPoints<T>(
  data: T[],
  startDate: Date,
  endDate: Date,
  intervalMinutes: number,
  createEmptyDataPoint: (timeMark: string) => T,
): T[] {
  const dataMap = new Map(data.map((item) => [item['time_mark'], item]));

  const filledData: T[] = [];
  let currentTime = DateTime.fromJSDate(startDate).toUTC();

  while (currentTime <= DateTime.fromJSDate(endDate).toUTC()) {
    const timeMark = currentTime.toISO();
    const existingData = dataMap.get(timeMark);

    if (existingData) {
      filledData.push(existingData);
    } else {
      filledData.push(createEmptyDataPoint(timeMark));
    }

    currentTime = currentTime.plus({ minutes: intervalMinutes });
  }

  return filledData;
}
