import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  Index,
  ManyToOne,
} from '@mikro-orm/core';
import { customAlphabet } from 'nanoid';
import { API_USER_UUID_ALPHABET } from '../../../../constants';
import { DistrictEntity } from './district.entity';
import { TimestampBaseEntity } from './timestamp-base.entity';
import { ROLE_TYPES, RoleType } from '../../../application/user/types';

@Entity({ tableName: 'users' })
export class UserEntity extends TimestampBaseEntity {
  @PrimaryKey()
  id: number;

  @Property({
    onCreate: () => customAlphabet(API_USER_UUID_ALPHABET)(36),
    unique: true,
    length: 36,
  })
  @Index()
  uuid: string;

  @Property({ unique: true })
  @Index()
  email: string;

  @Property({ hidden: true })
  password: string;

  @Property()
  fullName: string;

  @Enum({ items: () => ROLE_TYPES })
  role: RoleType;

  @Property({ nullable: true })
  remark?: string;

  @ManyToOne(() => DistrictEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  district?: DistrictEntity;
}
