import { Migration } from '@mikro-orm/migrations';

export class Migration20240927041543 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table `available_capacity_emergencies` add `is_success_sent` tinyint(1) not null default false;',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `available_capacity_emergencies` drop column `is_success_sent`;',
    );
  }
}
