import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  Index,
  ManyToOne,
  OneToMany,
  Cascade,
  Collection,
} from '@mikro-orm/core';
import { AccessTokenEntity } from './access-token.entity';
import { DistrictEntity } from './district.entity';
import { TimestampBaseEntity } from './timestamp-base.entity';
import { ROLE_TYPES, RoleType } from '../../../application/user/types';

@Entity({ tableName: 'users' })
export class UserEntity extends TimestampBaseEntity {
  @PrimaryKey()
  id: number;

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

  // to parent DistrictEntity
  @ManyToOne(() => DistrictEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  district?: DistrictEntity;

  // to child AccessTokenEntity
  @OneToMany({
    entity: () => AccessTokenEntity,
    mappedBy: 'user',
    cascade: [Cascade.ALL],
  })
  accessTokens = new Collection<AccessTokenEntity>(this);
}
