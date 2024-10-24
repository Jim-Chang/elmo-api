type LoadSiteUidMappingDataItem = {
  transformer: string[];
  charging_station: string[];
};

export type LoadSiteUidMappingData = Record<string, LoadSiteUidMappingDataItem>;
