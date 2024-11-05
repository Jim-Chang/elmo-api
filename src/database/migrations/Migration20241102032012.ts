import { Migration } from '@mikro-orm/migrations';

export class Migration20241102032012 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table `access_tokens` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null, `token` varchar(767) not null, `expired_at` datetime not null, `created_at` datetime not null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql(
      'alter table `access_tokens` add index `access_tokens_user_id_index`(`user_id`);',
    );
    this.addSql(
      'alter table `access_tokens` add index `access_tokens_token_index`(`token`);',
    );
    this.addSql(
      'alter table `access_tokens` add unique `access_tokens_token_unique`(`token`);',
    );

    this.addSql(
      'alter table `access_tokens` add constraint `access_tokens_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete cascade;',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `access_tokens`;');
  }
}
