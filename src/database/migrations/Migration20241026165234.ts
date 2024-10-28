import { Migration } from '@mikro-orm/migrations';

export class Migration20241026165234 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      "create table `users` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `uuid` varchar(36) not null, `email` varchar(255) not null, `password` varchar(255) not null, `full_name` varchar(255) not null, `role` enum('powerUser', 'supervisor') not null, `remark` varchar(255) null) default character set utf8mb4 engine = InnoDB;",
    );
    this.addSql('alter table `users` add index `users_uuid_index`(`uuid`);');
    this.addSql('alter table `users` add unique `users_uuid_unique`(`uuid`);');
    this.addSql('alter table `users` add index `users_email_index`(`email`);');
    this.addSql(
      'alter table `users` add unique `users_email_unique`(`email`);',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `users`;');
  }
}
