import { RequiredEntityData } from '@mikro-orm/core';
import { LoadSiteEntity } from '../../elmo/adapter/out/entities/load-site.entity';
import { LoadSiteCategory } from '../../elmo/application/load-site/types';

export const LoadSiteSeed: RequiredEntityData<LoadSiteEntity>[] = [
  {
    id: 1,
    uid: 'TPD102_B1',
    name: '台電北市區處 B1',
    address: '台北市大安區基隆路四段 75 號',
    category: LoadSiteCategory.HiCustomer,
    feeder: 1, // SV61
  },
  {
    id: 2,
    uid: 'TPD102_B2',
    name: '台電北市區處 B2',
    address: '台北市大安區基隆路四段 75 號',
    category: LoadSiteCategory.LoCustomer,
    feeder: 1, // SV61
  },
  {
    id: 3,
    uid: 'KAO101_01',
    name: '高雄鴻元工程',
    address: '高雄市鳳山區埤頂街 128 號',
    category: LoadSiteCategory.LoCustomer,
    feeder: 2, // B526
  },
  {
    id: 4,
    uid: 'NTP_01',
    name: '新北電力中心',
    address: '新北市中和區景平路 157 號',
    category: LoadSiteCategory.HiCustomer,
    feeder: 3, // WF37
  },
  {
    id: 5,
    uid: 'ML_B1',
    name: '苗栗賦格居',
    address: '苗栗縣頭份市中央路 168 號',
    category: LoadSiteCategory.LoCustomer,
    feeder: 4, // UL15
  },
  {
    id: 6,
    uid: 'BC_B1',
    name: '板橋大美社區',
    address: '新北市板橋區華江九路1號',
    category: LoadSiteCategory.HiCustomer,
    feeder: 5, // W360
  },
];
