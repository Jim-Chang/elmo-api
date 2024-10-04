import { Migration } from '@mikro-orm/migrations';

export class Migration20241004092029 extends Migration {

  override async up(): Promise<void> {
    this.addSql('alter table `csms` drop column `oscp_endpoint`;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `csms` add `oscp_endpoint` varchar(255) null;');
  }

}
