export type ChargingStationFifteenMinuteESRawData = {
  time_mark: string; // 使用 ISO time_mark

  kw: number | null; // 15 分鐘內平均出來的負載功率
};

export type ChargingStationOneHourESRawData =
  ChargingStationFifteenMinuteESRawData;

export type ChargingStationOneDayESRawData = {
  time_mark: string; // 使用 ISO time_mark

  kwh: number | null; // 當日內負載電量
  life_kwh_total: number | null; // 當日 concentrated 的最後一筆總電量, 生命週期總負載電量(不斷累積)
};
