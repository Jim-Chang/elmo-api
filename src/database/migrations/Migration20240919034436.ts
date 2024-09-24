import { Migration } from '@mikro-orm/migrations';

export class Migration20240919034436 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table `charging_stations` add `is_connected` tinyint(1) not null default false, add `contract_capacity` float not null default 0;',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `charging_stations` drop column `is_connected`, drop column `contract_capacity`;',
    );
  }
}
