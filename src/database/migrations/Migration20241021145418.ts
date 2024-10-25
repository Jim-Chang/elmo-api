import { Migration } from '@mikro-orm/migrations';

export class Migration20241021145418 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `load_sites` add `address` varchar(255) null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `load_sites` drop column `address`;');
  }
}
