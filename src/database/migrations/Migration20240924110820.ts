import { Migration } from '@mikro-orm/migrations';

export class Migration20240924110820 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table `available_capacity_emergencies` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `charging_station_id` int unsigned not null, `period_start_at` datetime not null, `period_end_at` datetime not null, `capacity` int not null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql(
      'alter table `available_capacity_emergencies` add index `available_capacity_emergencies_charging_station_id_index`(`charging_station_id`);',
    );

    this.addSql(
      'alter table `available_capacity_emergencies` add constraint `available_capacity_emergencies_charging_station_id_foreign` foreign key (`charging_station_id`) references `charging_stations` (`id`) on update cascade;',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `available_capacity_emergencies`;');
  }
}
