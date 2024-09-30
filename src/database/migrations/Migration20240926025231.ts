import { Migration } from '@mikro-orm/migrations';

export class Migration20240926025231 extends Migration {

  override async up(): Promise<void> {
    this.addSql('create table `districts` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('alter table `charging_stations` add `district_id` int unsigned null;');
    this.addSql('alter table `charging_stations` add constraint `charging_stations_district_id_foreign` foreign key (`district_id`) references `districts` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `charging_stations` add index `charging_stations_district_id_index`(`district_id`);');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `charging_stations` drop foreign key `charging_stations_district_id_foreign`;');

    this.addSql('drop table if exists `districts`;');

    this.addSql('alter table `charging_stations` drop index `charging_stations_district_id_index`;');
    this.addSql('alter table `charging_stations` drop column `district_id`;');
  }

}
