import { RequiredEntityData } from '@mikro-orm/core';
import { TransformerEntity } from '../../elmo/adapter/out/entities/transformer.entity';

export const TransformerSeed: RequiredEntityData<TransformerEntity>[] = [
  {
    id: 1,
    uid: 'B6734_AE0100_F01',
    name: '北市區處 B1 變壓器',
    tpclid: 'B6734AE0100',
    group: '',
    capacity: 501,
    voltageLevel: 22800,
    loadSite: 1, // 台電北市區處 B1
  },
  {
    id: 2,
    uid: 'B6734_AE0100_J24_T02',
    name: '北市區處 B2 變壓器',
    tpclid: 'B6734AE0100',
    group: 'T02',
    capacity: 167,
    voltageLevel: 22800,
    loadSite: 2, // 台電北市區處 B2
  },
  {
    id: 3,
    uid: 'Q1907_CC4701_V27261x13_V17651x3',
    name: '高雄鴻元 變壓器',
    tpclid: 'Q1907CC4701',
    group: '',
    capacity: 75,
    voltageLevel: 11400,
    loadSite: 3, // 高雄鴻元工程
  },
  {
    id: 4,
    uid: 'NTP_ELMO_DK1000_01',
    name: '新北電力中心 變壓器',
    tpclid: 'B6330FC61',
    group: '',
    capacity: 361,
    voltageLevel: 11400,
    loadSite: 4, // 新北電力中心
  },
  {
    id: 5,
    uid: 'ML_ELMO_GW01',
    name: '苗栗賦格居 變壓器',
    tpclid: 'D8663GC61',
    group: 'T03',
    capacity: 150,
    voltageLevel: 11400,
    loadSite: 5, // 苗栗賦格居
  },
  {
    id: 6,
    uid: 'B5739_GB2822_T01_3',
    name: '板橋大美社區 變壓器',
    tpclid: 'B5739GB2822',
    group: 'T01',
    capacity: 501,
    voltageLevel: 22800,
    loadSite: 6, // 板橋大美社區
  },
];
