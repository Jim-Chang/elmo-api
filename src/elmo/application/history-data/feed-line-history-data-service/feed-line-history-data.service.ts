import { Injectable } from '@nestjs/common';
import { LoadSiteHistoryDataService } from '../load-site-history-data-service/load-site-history-data.service';
import {
  LoadSiteFifteenMinuteESRawData,
  LoadSiteOneDayESRawData,
  LoadSiteOneHourESRawData,
} from '../load-site-history-data-service/types';
import _ from 'lodash';
import {
  FeedLineFifteenMinuteESRawData,
  FeedLineOneDayESRawData,
  FeedLineOneHourESRawData,
} from './types';

@Injectable()
export class FeedLineHistoryDataService {
  constructor(
    private readonly loadSiteHistoryDataService: LoadSiteHistoryDataService,
  ) {}

  async queryInFifteenMinuteDataInterval(
    loadSiteUidList: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<FeedLineFifteenMinuteESRawData[]> {
    const loadSiteRawDataList = await Promise.all(
      loadSiteUidList.map((uid) =>
        this.loadSiteHistoryDataService.queryInFifteenMinuteDataInterval(
          uid,
          startDate,
          endDate,
        ),
      ),
    );

    const dataInitializer: DataInitializerFunc = (timeMark) => ({
      time_mark: timeMark,
      total_load_kw: null,
      charge_load_kw: null,
      demand_load_kw: null,
    });

    const mergeFields: MergeFieldsFunc = (
      acc: LoadSiteFifteenMinuteESRawData,
      curr: LoadSiteFifteenMinuteESRawData,
    ) => {
      if (curr.total_load_kw !== null) {
        acc.total_load_kw = (acc.total_load_kw ?? 0) + curr.total_load_kw;
      }
      if (curr.charge_load_kw !== null) {
        acc.charge_load_kw = (acc.charge_load_kw ?? 0) + curr.charge_load_kw;
      }
      if (curr.demand_load_kw !== null) {
        acc.demand_load_kw = (acc.demand_load_kw ?? 0) + curr.demand_load_kw;
      }
      return acc;
    };

    return mergeLoadSiteESRawData(
      dataInitializer,
      mergeFields,
      loadSiteRawDataList,
    ) as FeedLineFifteenMinuteESRawData[];
  }

  async queryInOneHourDataInterval(
    loadSiteUidList: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<FeedLineOneHourESRawData[]> {
    const loadSiteRawDataList = await Promise.all(
      loadSiteUidList.map((uid) =>
        this.loadSiteHistoryDataService.queryInOneHourDataInterval(
          uid,
          startDate,
          endDate,
        ),
      ),
    );

    const dataInitializer: DataInitializerFunc = (timeMark) => ({
      time_mark: timeMark,
      total_load_kw: null,
      charge_load_kw: null,
      demand_load_kw: null,
    });

    const mergeFields: MergeFieldsFunc = (
      acc: LoadSiteOneHourESRawData,
      curr: LoadSiteOneHourESRawData,
    ) => {
      if (curr.total_load_kw !== null) {
        acc.total_load_kw = (acc.total_load_kw ?? 0) + curr.total_load_kw;
      }
      if (curr.charge_load_kw !== null) {
        acc.charge_load_kw = (acc.charge_load_kw ?? 0) + curr.charge_load_kw;
      }
      if (curr.demand_load_kw !== null) {
        acc.demand_load_kw = (acc.demand_load_kw ?? 0) + curr.demand_load_kw;
      }
      return acc;
    };

    return mergeLoadSiteESRawData(
      dataInitializer,
      mergeFields,
      loadSiteRawDataList,
    ) as FeedLineOneHourESRawData[];
  }

  async queryInOneDayDataInterval(
    loadSiteUidList: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<FeedLineOneDayESRawData[]> {
    const loadSiteRawDataList = await Promise.all(
      loadSiteUidList.map((uid) =>
        this.loadSiteHistoryDataService.queryInOneDayDataInterval(
          uid,
          startDate,
          endDate,
        ),
      ),
    );

    const dataInitializer: DataInitializerFunc = (timeMark) => ({
      time_mark: timeMark,
      total_load_kwh: null,
      charge_load_kwh: null,
      demand_load_kwh: null,
    });

    const mergeFields: MergeFieldsFunc = (
      acc: LoadSiteOneDayESRawData,
      curr: LoadSiteOneDayESRawData,
    ) => {
      if (curr.total_load_kwh !== null) {
        acc.total_load_kwh = (acc.total_load_kwh ?? 0) + curr.total_load_kwh;
      }
      if (curr.charge_load_kwh !== null) {
        acc.charge_load_kwh = (acc.charge_load_kwh ?? 0) + curr.charge_load_kwh;
      }
      if (curr.demand_load_kwh !== null) {
        acc.demand_load_kwh = (acc.demand_load_kwh ?? 0) + curr.demand_load_kwh;
      }
      return acc;
    };

    return mergeLoadSiteESRawData(
      dataInitializer,
      mergeFields,
      loadSiteRawDataList,
    ) as FeedLineOneDayESRawData[];
  }
}

type SupportESRawData =
  | LoadSiteFifteenMinuteESRawData
  | LoadSiteOneHourESRawData
  | LoadSiteOneDayESRawData;

type DataInitializerFunc = (timeMark: string) => SupportESRawData;

type MergeFieldsFunc = (
  acc: SupportESRawData,
  curr: SupportESRawData,
) => SupportESRawData;

function mergeLoadSiteESRawData(
  dataInitializer: DataInitializerFunc,
  mergeFields: MergeFieldsFunc,
  arrays: SupportESRawData[][],
): SupportESRawData[] {
  // Merge all arrays
  const combinedArray = arrays.flat();

  // Use lodash groupBy to group by time_mark
  const groupedData = _.groupBy(combinedArray, 'time_mark');

  // Iterate over the grouped data and sum the fields with the same time_mark
  return Object.keys(groupedData).map((timeMark) => {
    const items = groupedData[timeMark];
    return items.reduce(
      (acc, curr) => mergeFields(acc, curr),
      dataInitializer(timeMark),
    );
  });
}
