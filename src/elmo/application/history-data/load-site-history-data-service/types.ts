export type LoadSiteFifteenMinuteESRawData = {
  time_mark: string; // 使用 ISO time_mark
  total_load_kw: number | null; // 總負載功率
  charge_load_kw: number | null; // 充電負載功率
  demand_load_kw: number | null; // 一般負載功率 (total_load_kw - charge_load_kw)
};

export type LoadSiteOneHourESRawData = LoadSiteFifteenMinuteESRawData;

export type LoadSiteOneDayESRawData = {
  time_mark: string; // 使用 ISO time_mark
  total_load_kwh: number | null; // 總負載電量
  charge_load_kwh: number | null; // 充電負載電量
  demand_load_kwh: number | null; // 一般負載電量 (total_load_kwh - charge_load_kwh)
};

export type LoadSiteOneHourMaxDemandLoadESData = {
  time_mark: string; // 使用 ISO time_mark

  max_demand_load_kw: number | null; // 1 小時內最大負載功率
};
