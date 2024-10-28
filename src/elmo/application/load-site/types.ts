export enum LoadSiteCategory {
  HiCustomer = 'HICUSTOMER', // 高供用戶
  LoCustomer = 'LOCUSTOMER', // 低壓用戶
}

type LoadSiteUidMappingDataItem = {
  transformer: string[];
  charging_station: string[];
};

export type LoadSiteUidMappingData = Record<string, LoadSiteUidMappingDataItem>;
