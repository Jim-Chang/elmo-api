export type TransformerFifteenMinuteESRawData = {
  // 基本資料
  transformer_id: string; // 變壓器 ID
  time_mark: string; // 使用 ISO time_mark

  // 即時輸出電功率 (平均值，每 15 分鐘計算一次)
  ac_power_meter_output_kw: number; // 功率
  ac_power_meter_output_kvar: number; // 虛功
  ac_power_meter_output_kva: number; // 視在功率
  ac_power_meter_output_pf: number; // 功率因數

  // 頻率 (平均值，每 15 分鐘計算一次)
  ac_power_meter_freq: number; // 頻率

  // 線電流 A (平均值，每 15 分鐘計算一次)
  ac_power_meter_line_amps_a: number; // A
  ac_power_meter_line_amps_b: number; // B
  ac_power_meter_line_amps_c: number; // C

  // 線電壓 V (平均值，每 15 分鐘計算一次)
  ac_power_meter_line_volts_a_b: number; // A-B
  ac_power_meter_line_volts_b_c: number; // B-C
  ac_power_meter_line_volts_c_a: number; // C-A
};

export type TransformerOneHourESRawData = TransformerFifteenMinuteESRawData;

export type TransformerOneDayESRawData = {
  // 基本資料
  transformer_id: string; // 變壓器 ID
  time_mark: string; // 使用 ISO time_mark

  // 當日最後一筆 扣掉 當日第一筆 (輸入電量)
  ac_power_meter_kwh: number; // Δ 輸入有效電能
  ac_power_meter_kvarh: number; // Δ 輸入無效電能
  ac_power_meter_kvah: number; // Δ 輸入視在電能

  // 歷史輸出電量 (取最後一筆)
  ac_power_meter_output_kwh: number; // 有效電能
  ac_power_meter_output_kvarh: number; // 無效電能
  ac_power_meter_output_kvah: number; // 輸出視在電能

  // 歷史輸入電量 (取最後一筆)
  ac_power_meter_input_kwh: number; // 有效電能
  ac_power_meter_input_kvarh: number; // 無效電能
  ac_power_meter_input_kvah: number; // 輸入視在電能
};
