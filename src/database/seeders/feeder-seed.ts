import { RequiredEntityData } from '@mikro-orm/core';
import { FeederEntity } from '../../elmo/adapter/out/entities/feeder.entity';

export const FeederSeed: RequiredEntityData<FeederEntity>[] = [
  {
    id: 1,
    name: 'SV61',
    district: 2, // 台北市區營業處
  },
  {
    id: 2,
    name: 'B526',
    district: 17, // 鳳山區營業處
  },
  {
    id: 3,
    name: 'WF37',
    district: 3, // 台北南區營業處
  },
  {
    id: 4,
    name: 'UL15',
    district: 8, // 苗栗區營業處
  },
  {
    id: 5,
    name: 'W360',
    district: 3, // 台北南區營業處
  },
];
