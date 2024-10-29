import { Migration } from '@mikro-orm/migrations';

export class Migration20241028071752 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `users` drop index `users_uuid_index`;');
    this.addSql('alter table `users` drop index `users_uuid_unique`;');
    this.addSql('alter table `users` drop column `uuid`;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `users` add `uuid` varchar(36) not null;');
    this.addSql('alter table `users` add index `users_uuid_index`(`uuid`);');
    this.addSql('alter table `users` add unique `users_uuid_unique`(`uuid`);');
  }
}
