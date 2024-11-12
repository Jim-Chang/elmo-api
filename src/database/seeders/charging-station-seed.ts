import { RequiredEntityData } from '@mikro-orm/core';
import { ChargingStationEntity } from '../../elmo/adapter/out/entities/charging-station.entity';

export const ChargingStationSeed: RequiredEntityData<ChargingStationEntity>[] =
  [
    {
      id: 1,
      uid: 'B6734_AE0100_00848825118',
      name: '北市區處B1 充電站',
      contractCapacity: 390,
      electricityAccountNo: '00-84-8825-11-8',
      loadSite: 1, // 台電北市區處 B1
      feeder: 1, // SV61
      district: 2, // 台北市區營業處
    },
    {
      id: 2,
      uid: 'B6734_AE0100_00848821001',
      name: '北市區處B2 充電站',
      contractCapacity: 100,
      electricityAccountNo: '00-84-8821-00-1',
      loadSite: 2, // 台電北市區處 B2
      feeder: 1, // SV61
      district: 2, // 台北市區營業處
    },
    {
      id: 3,
      uid: 'Q1907_CC4701_18364851681',
      name: '高雄鴻元 充電站',
      contractCapacity: 15,
      electricityAccountNo: '18-36-4851-68-1',
      loadSite: 3, // 高雄鴻元工程
      feeder: 2, // B526
      district: 17, // 鳳山區營業處
    },
    {
      id: 4,
      uid: 'B6330_FC61_01718611116',
      name: '新北電力中心 充電站',
      contractCapacity: 361,
      electricityAccountNo: '01-71-8611-11-6',
      loadSite: 4, // 新北電力中心
      feeder: 3, // WF37
      district: 3, // 台北南區營業處
    },
    {
      id: 5,
      uid: 'D8663_GC61_21418956041',
      name: '苗栗賦格居 充電站',
      contractCapacity: 99,
      electricityAccountNo: '21-41-8956-04-1',
      loadSite: 5, // 苗栗賦格居
      feeder: 4, // UL15
      district: 8, // 苗栗區營業處
    },
    {
      id: 6,
      uid: 'B5739_GB2822_01018726028',
      name: '板橋大美社區 充電站',
      contractCapacity: 99,
      electricityAccountNo: '01-01-8726-02-8',
      loadSite: 6, // 板橋大美社區
      feeder: 5, // W360
      district: 3, // 台北南區營業處
    },
  ];
