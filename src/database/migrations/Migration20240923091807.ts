import { Migration } from '@mikro-orm/migrations';

export class Migration20240923091807 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table `csms` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `oscp_base_url` varchar(255) null, `oscp_endpoint` varchar(255) null, `oscp_token` varchar(1024) null, `is_connected` tinyint(1) not null default false) default character set utf8mb4 engine = InnoDB;',
    );

    this.addSql('alter table `charging_stations` drop column `is_connected`;');

    this.addSql(
      'alter table `charging_stations` add `csms_id` int unsigned null;',
    );
    this.addSql(
      'alter table `charging_stations` add constraint `charging_stations_csms_id_foreign` foreign key (`csms_id`) references `csms` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `charging_stations` add index `charging_stations_csms_id_index`(`csms_id`);',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `charging_stations` drop foreign key `charging_stations_csms_id_foreign`;',
    );

    this.addSql('drop table if exists `csms`;');

    this.addSql(
      'alter table `charging_stations` drop index `charging_stations_csms_id_index`;',
    );
    this.addSql('alter table `charging_stations` drop column `csms_id`;');

    this.addSql(
      'alter table `charging_stations` add `is_connected` tinyint(1) not null default false;',
    );
  }
}
