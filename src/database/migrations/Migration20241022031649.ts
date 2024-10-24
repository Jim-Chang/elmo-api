import { Migration } from '@mikro-orm/migrations';

export class Migration20241022031649 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table `transformers` add `tpclid` varchar(255) not null, add `group` varchar(255) not null, add `capacity` int not null, add `voltage_level` int not null;',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `transformers` drop column `tpclid`, drop column `group`, drop column `capacity`, drop column `voltage_level`;',
    );
  }
}
