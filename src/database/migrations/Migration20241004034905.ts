import { Migration } from '@mikro-orm/migrations';

export class Migration20241004034905 extends Migration {

  override async up(): Promise<void> {
    this.addSql('alter table `csms` add `is_sent_handshake` tinyint(1) not null default false;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `csms` drop column `is_sent_handshake`;');
  }

}
