import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'access_tokens' })
export class AccessTokenEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  // to parent UserEntity
  @ManyToOne(() => UserEntity, {
    nullable: false,
    deleteRule: 'cascade',
  })
  user!: UserEntity;

  @Index()
  @Property({ length: 767, unique: true })
  token: string;

  @Property()
  expiredAt!: Date;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;
}
