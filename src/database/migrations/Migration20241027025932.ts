import { Migration } from '@mikro-orm/migrations';

export class Migration20241027025932 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `users` add `district_id` int unsigned null;');
    this.addSql(
      'alter table `users` add constraint `users_district_id_foreign` foreign key (`district_id`) references `districts` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `users` add index `users_district_id_index`(`district_id`);',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `users` drop foreign key `users_district_id_foreign`;',
    );

    this.addSql('alter table `users` drop index `users_district_id_index`;');
    this.addSql('alter table `users` drop column `district_id`;');
  }
}
