import { Migration } from '@mikro-orm/migrations';

export class Migration20240910063703 extends Migration {

  override async up(): Promise<void> {
    this.addSql('create table `charging_stations` (`id` int unsigned not null auto_increment primary key, `uid` varchar(255) not null, `name` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `charging_stations` add unique `charging_stations_uid_unique`(`uid`);');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `charging_stations`;');
  }

}
