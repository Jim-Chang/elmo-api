import { Property } from '@mikro-orm/core';

export abstract class TimestampBaseEntity {
  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
