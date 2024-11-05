import { Migration } from '@mikro-orm/migrations';

export class Migration20241105032904 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table `districts` add `code` varchar(255) not null, add `is_activated` tinyint(1) not null default true;',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `districts` drop column `code`, drop column `is_activated`;',
    );
  }
}
