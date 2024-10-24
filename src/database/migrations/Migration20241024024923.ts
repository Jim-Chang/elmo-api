import { Migration } from '@mikro-orm/migrations';

export class Migration20241024024923 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `load_sites` add `uid` varchar(255) not null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `load_sites` drop column `uid`;');
  }
}
