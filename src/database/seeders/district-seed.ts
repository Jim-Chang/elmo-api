import { RequiredEntityData } from '@mikro-orm/core';
import { DistrictEntity } from '../../elmo/adapter/out/entities/district.entity';

export const DistrictSeed: RequiredEntityData<DistrictEntity>[] = [
  {
    id: 1,
    name: '基隆區營業處',
    code: '101',
    isActivated: false,
  },
  {
    id: 2,
    name: '台北市區營業處',
    code: '102',
    isActivated: true,
  },
  {
    id: 3,
    name: '台北南區營業處',
    code: '115',
    isActivated: true,
  },
  {
    id: 4,
    name: '台北北區營業處',
    code: '116',
    isActivated: false,
  },
  {
    id: 5,
    name: '台北西區營業處',
    code: '117',
    isActivated: false,
  },
  {
    id: 6,
    name: '桃園區營業處',
    code: '103',
    isActivated: false,
  },
  {
    id: 7,
    name: '新竹區營業處',
    code: '104',
    isActivated: false,
  },
  {
    id: 8,
    name: '苗栗區營業處',
    code: '122',
    isActivated: true,
  },
  {
    id: 9,
    name: '台中區營業處',
    code: '105',
    isActivated: false,
  },
  {
    id: 10,
    name: '南投區營業處',
    code: '118',
    isActivated: false,
  },
  {
    id: 11,
    name: '彰化區營業處',
    code: '106',
    isActivated: false,
  },
  {
    id: 12,
    name: '雲林區營業處',
    code: '120',
    isActivated: false,
  },
  {
    id: 13,
    name: '嘉義區營業處',
    code: '107',
    isActivated: false,
  },
  {
    id: 14,
    name: '新營區營業處',
    code: '121',
    isActivated: false,
  },
  {
    id: 15,
    name: '台南區營業處',
    code: '108',
    isActivated: false,
  },
  {
    id: 16,
    name: '高雄區營業處',
    code: '109',
    isActivated: false,
  },
  {
    id: 17,
    name: '鳳山區營業處',
    code: '119',
    isActivated: true,
  },
  {
    id: 18,
    name: '屏東區營業處',
    code: '110',
    isActivated: false,
  },
  {
    id: 19,
    name: '台東區營業處',
    code: '111',
    isActivated: false,
  },
  {
    id: 20,
    name: '花蓮區營業處',
    code: '112',
    isActivated: false,
  },
  {
    id: 21,
    name: '宜蘭區營業處',
    code: '113',
    isActivated: false,
  },
  {
    id: 22,
    name: '澎湖區營業處',
    code: '114',
    isActivated: false,
  },
  {
    id: 23,
    name: '金門區營業處',
    code: '123',
    isActivated: false,
  },
  {
    id: 24,
    name: '馬祖區營業處',
    code: '124',
    isActivated: false,
  },
];
