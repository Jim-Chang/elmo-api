import { Migration } from '@mikro-orm/migrations';

export class Migration20241003073628 extends Migration {

  override async up(): Promise<void> {
    this.addSql('alter table `csms` drop column `oscp_token`;');

    this.addSql('alter table `csms` add `oscp_csms_token` varchar(767) null, add `oscp_elmo_token` varchar(767) null;');
    this.addSql('alter table `csms` add index `csms_oscp_csms_token_index`(`oscp_csms_token`);');
    this.addSql('alter table `csms` add unique `csms_oscp_csms_token_unique`(`oscp_csms_token`);');
    this.addSql('alter table `csms` add index `csms_oscp_elmo_token_index`(`oscp_elmo_token`);');
    this.addSql('alter table `csms` add unique `csms_oscp_elmo_token_unique`(`oscp_elmo_token`);');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `csms` drop index `csms_oscp_csms_token_index`;');
    this.addSql('alter table `csms` drop index `csms_oscp_csms_token_unique`;');
    this.addSql('alter table `csms` drop index `csms_oscp_elmo_token_index`;');
    this.addSql('alter table `csms` drop index `csms_oscp_elmo_token_unique`;');
    this.addSql('alter table `csms` drop column `oscp_csms_token`, drop column `oscp_elmo_token`;');

    this.addSql('alter table `csms` add `oscp_token` varchar(1024) null;');
  }

}
