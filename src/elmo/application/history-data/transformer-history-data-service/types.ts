export type TransformerFifteenMinuteESRawData = {
  // 基本資料
  time_mark: string; // 使用 ISO time_mark

  // 即時輸出電功率 (平均值，每 15 分鐘計算一次)
  ac_power_meter_output_kw: number | null; // 功率
  ac_power_meter_output_kvar: number | null; // 虛功
  ac_power_meter_output_kva: number | null; // 視在功率
  ac_power_meter_output_pf: number | null; // 功率因數

  // 頻率 (平均值，每 15 分鐘計算一次)
  ac_power_meter_freq: number | null; // 頻率

  // 線電流 A (平均值，每 15 分鐘計算一次)
  ac_power_meter_line_amps_a: number | null; // A
  ac_power_meter_line_amps_b: number | null; // B
  ac_power_meter_line_amps_c: number | null; // C

  // 線電壓 V (平均值，每 15 分鐘計算一次)
  ac_power_meter_line_volts_a_b: number | null; // A-B
  ac_power_meter_line_volts_b_c: number | null; // B-C
  ac_power_meter_line_volts_c_a: number | null; // C-A
};

export type TransformerOneHourESRawData = TransformerFifteenMinuteESRawData;

export type TransformerOneDayESRawData = {
  // 基本資料
  time_mark: string; // 使用 ISO time_mark

  // 當日最後一筆 扣掉 當日第一筆 (輸入電量)
  ac_power_meter_input_kwh_today: number | null; // Δ 輸入有效電能
  ac_power_meter_input_kvarh_today: number | null; // Δ 輸入無效電能
  ac_power_meter_input_kvah_today: number | null; // Δ 輸入視在電能

  // 歷史輸出電量 (取最後一筆)
  ac_power_meter_output_kwh: number | null; // 有效電能
  ac_power_meter_output_kvarh: number | null; // 無效電能
  ac_power_meter_output_kvah: number | null; // 輸出視在電能

  // 歷史輸入電量 (取最後一筆)
  ac_power_meter_input_kwh: number | null; // 有效電能
  ac_power_meter_input_kvarh: number | null; // 無效電能
  ac_power_meter_input_kvah: number | null; // 輸入視在電能
};
