import { Migration } from '@mikro-orm/migrations';

export class Migration20241021034106 extends Migration {

  override async up(): Promise<void> {
    this.addSql('alter table `transformers` add `uid` varchar(255) not null;');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `transformers` drop column `uid`;');
  }

}
