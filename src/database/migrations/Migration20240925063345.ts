import { Migration } from '@mikro-orm/migrations';

export class Migration20240925063345 extends Migration {

  override async up(): Promise<void> {
    this.addSql('alter table `charging_stations` add `electricity_account_no` varchar(255) null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `charging_stations` drop column `electricity_account_no`;');
  }

}
