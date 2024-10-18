export type ChargingStationRealTimeData = {
  uid: string;
  time_mark: Date | null;
  kw: number | null;
};

export type TransformerRealTimeData = {
  uid: string;
  time_mark: Date | null;

  // 即時輸出電功率
  ac_power_meter_output_kw: number | null; // 實功率
  ac_power_meter_output_kvar: number | null; // 虛功率
  ac_power_meter_output_kva: number | null; // 視在功率
  ac_power_meter_output_pf: number | null; // 功率因數
  ac_power_meter_freq: number | null; // 頻率

  // 線電流 A
  ac_power_meter_line_amps_a: number | null; // 線電流 a
  ac_power_meter_line_amps_b: number | null; // 線電流 b
  ac_power_meter_line_amps_c: number | null; // 線電流 c

  // 線電壓 V
  ac_power_meter_line_volts_a_b: number | null; // 線電壓 a-b
  ac_power_meter_line_volts_b_c: number | null; // 線電壓 b-c
  ac_power_meter_line_volts_c_a: number | null; // 線電壓 c-a

  // 歷史輸出電量
  ac_power_meter_output_kwh: number | null; // 歷史輸出有效電能
  ac_power_meter_output_kvarh: number | null; // 歷史輸出無效電能
  ac_power_meter_output_kvah: number | null; // 歷史輸出視在電能

  // 歷史輸入電量
  ac_power_meter_input_kwh: number | null; // 歷史輸入有效電能
  ac_power_meter_input_kvarh: number | null; // 歷史輸入無效電能
  ac_power_meter_input_kvah: number | null; // 歷史輸入視在電能
};
