import { Migration } from '@mikro-orm/migrations';

export class Migration20241028074351 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      "alter table `load_sites` add `category` enum('HICUSTOMER', 'LOCUSTOMER') not null;",
    );
  }

  override async down(): Promise<void> {
    this.addSql('alter table `load_sites` drop column `category`;');
  }
}
