import { Migration } from '@mikro-orm/migrations';

export class Migration20240925062855 extends Migration {

  override async up(): Promise<void> {
    this.addSql('create table `feed_lines` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('create table `load_sites` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('alter table `charging_stations` add `load_site_id` int unsigned null, add `feed_line_id` int unsigned null;');
    this.addSql('alter table `charging_stations` add constraint `charging_stations_load_site_id_foreign` foreign key (`load_site_id`) references `load_sites` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `charging_stations` add constraint `charging_stations_feed_line_id_foreign` foreign key (`feed_line_id`) references `feed_lines` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `charging_stations` add index `charging_stations_load_site_id_index`(`load_site_id`);');
    this.addSql('alter table `charging_stations` add index `charging_stations_feed_line_id_index`(`feed_line_id`);');
  }

  override async down(): Promise<void> {
    this.addSql('alter table `charging_stations` drop foreign key `charging_stations_feed_line_id_foreign`;');

    this.addSql('alter table `charging_stations` drop foreign key `charging_stations_load_site_id_foreign`;');

    this.addSql('drop table if exists `feed_lines`;');

    this.addSql('drop table if exists `load_sites`;');

    this.addSql('alter table `charging_stations` drop index `charging_stations_load_site_id_index`;');
    this.addSql('alter table `charging_stations` drop index `charging_stations_feed_line_id_index`;');
    this.addSql('alter table `charging_stations` drop column `load_site_id`, drop column `feed_line_id`;');
  }

}
