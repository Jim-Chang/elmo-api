import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  TransformerFifteenMinuteESRawData,
  TransformerOneDayESRawData,
  TransformerOneHourESRawData,
} from './types';
import { DateTime, Interval } from 'luxon';

// log-elmo-transformer-concentrated-{YYYY}-{mm}
const FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME =
  'log-elmo-transformer-concentrated-';

// log-elmo-transformer-statistics
const ONE_DAY_INTERVAL_INDEX_NAME = 'log-elmo-transformer-statistics';

@Injectable()
export class TransformerHistoryDataService {
  constructor(private readonly es: ElasticsearchService) {}

  async queryInFifteenMinuteDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransformerFifteenMinuteESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { transformer_id: uid } },
          {
            range: {
              time_mark: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
        ],
      },
    };

    const size = getDataSizeOfFifteenMinuteInterval(startDate, endDate);

    const result = await this.es.search({
      index: indexNameList.join(','),
      query,
      size,
      sort: [{ time_mark: { order: 'asc' } }],
    });

    return result.hits.hits
      .map((hit) => hit._source as any)
      .map((source) => ({
        ...source,
        time_mark: ensureTimeMarkIsISOFormat(source.time_mark),
      }));
  }

  async queryInOneHourDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransformerOneHourESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { transformer_id: uid } },
          {
            range: {
              time_mark: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
        ],
      },
    };

    const aggs = {
      hourly_data: {
        date_histogram: {
          field: 'time_mark',
          fixed_interval: '1h',
        },
        aggs: {
          avg_ac_power_meter_output_kw: {
            avg: { field: 'ac_power_meter_output_kw' },
          },
          avg_ac_power_meter_output_kvar: {
            avg: { field: 'ac_power_meter_output_kvar' },
          },
          avg_ac_power_meter_output_kva: {
            avg: { field: 'ac_power_meter_output_kva' },
          },
          avg_ac_power_meter_output_pf: {
            avg: { field: 'ac_power_meter_output_pf' },
          },
          avg_ac_power_meter_freq: { avg: { field: 'ac_power_meter_freq' } },
          avg_ac_power_meter_line_amps_a: {
            avg: { field: 'ac_power_meter_line_amps_a' },
          },
          avg_ac_power_meter_line_amps_b: {
            avg: { field: 'ac_power_meter_line_amps_b' },
          },
          avg_ac_power_meter_line_amps_c: {
            avg: { field: 'ac_power_meter_line_amps_c' },
          },
          avg_ac_power_meter_line_volts_a_b: {
            avg: { field: 'ac_power_meter_line_volts_a_b' },
          },
          avg_ac_power_meter_line_volts_b_c: {
            avg: { field: 'ac_power_meter_line_volts_b_c' },
          },
          avg_ac_power_meter_line_volts_c_a: {
            avg: { field: 'ac_power_meter_line_volts_c_a' },
          },
        },
      },
    };

    const size = getDataSizeOfFifteenMinuteInterval(startDate, endDate);

    const result = await this.es.search({
      index: indexNameList.join(','),
      query,
      aggs,
      size,
      sort: [{ time_mark: { order: 'asc' } }],
    });

    // @ts-ignore
    const buckets = result.aggregations.hourly_data.buckets;
    return buckets.map((bucket: any) => {
      return {
        transformer_id: uid,
        time_mark: bucket.key_as_string,
        ac_power_meter_output_kw:
          bucket.avg_ac_power_meter_output_kw.value ?? 0,
        ac_power_meter_output_kvar:
          bucket.avg_ac_power_meter_output_kvar.value ?? 0,
        ac_power_meter_output_kva:
          bucket.avg_ac_power_meter_output_kva.value ?? 0,
        ac_power_meter_output_pf:
          bucket.avg_ac_power_meter_output_pf.value ?? 0,
        ac_power_meter_freq: bucket.avg_ac_power_meter_freq.value ?? 0,
        ac_power_meter_line_amps_a:
          bucket.avg_ac_power_meter_line_amps_a.value ?? 0,
        ac_power_meter_line_amps_b:
          bucket.avg_ac_power_meter_line_amps_b.value ?? 0,
        ac_power_meter_line_amps_c:
          bucket.avg_ac_power_meter_line_amps_c.value ?? 0,
        ac_power_meter_line_volts_a_b:
          bucket.avg_ac_power_meter_line_volts_a_b.value ?? 0,
        ac_power_meter_line_volts_b_c:
          bucket.avg_ac_power_meter_line_volts_b_c.value ?? 0,
        ac_power_meter_line_volts_c_a:
          bucket.avg_ac_power_meter_line_volts_c_a.value ?? 0,
      };
    });
  }

  async queryInOneDayDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransformerOneDayESRawData[]> {
    const query = {
      bool: {
        must: [
          { match: { transformer_id: uid } },
          {
            range: {
              time_mark: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
        ],
      },
    };

    const size = getDataSizeOfOneDayInterval(startDate, endDate);

    const result = await this.es.search({
      index: ONE_DAY_INTERVAL_INDEX_NAME,
      query,
      size,
      sort: [{ time_mark: { order: 'asc' } }],
    });

    return result.hits.hits
      .map((hit) => hit._source as any)
      .map((source) => ({
        ...source,
        time_mark: ensureTimeMarkIsISOFormat(source.time_mark),
      }));
  }
}

function getDataSizeOfFifteenMinuteInterval(startDate: Date, endDate: Date) {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const interval = Interval.fromDateTimes(start, end);
  return Math.ceil(interval.length('minutes') / 15);
}

function getDataSizeOfOneDayInterval(startDate: Date, endDate: Date) {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const interval = Interval.fromDateTimes(start, end);
  return Math.ceil(interval.length('days'));
}

function eachMonthOfInterval(startDate: Date, endDate: Date) {
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const interval = Interval.fromDateTimes(start, end);
  return interval.splitBy({ months: 1 }).map((i) => i.start);
}

function buildFifteenMinuteIntervalIndexNameList(
  startDate: Date,
  endDate: Date,
) {
  const dates = eachMonthOfInterval(startDate, endDate);
  return dates.map(
    (date) =>
      `${FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME}${date.toFormat('yyyy-MM')}`,
  );
}

function ensureTimeMarkIsISOFormat(timeMark: string) {
  // To ensure time_mark is in ISO format (+0) because time_mark may be another time zone, e.g., +08:00
  return DateTime.fromISO(timeMark, {
    zone: 'utc',
  }).toISO();
}
