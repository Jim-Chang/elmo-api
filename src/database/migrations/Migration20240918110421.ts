import { Migration } from '@mikro-orm/migrations';

export class Migration20240918110421 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      "create table `available_capacity_negotiations` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `date` datetime not null, `charging_station_id` int unsigned not null, `apply_detail_id` int unsigned null, `last_detail_status` varchar(255) not null default 'INITIAL_EDIT') default character set utf8mb4 engine = InnoDB;",
    );
    this.addSql(
      'alter table `available_capacity_negotiations` add index `available_capacity_negotiations_charging_station_id_index`(`charging_station_id`);',
    );
    this.addSql(
      'alter table `available_capacity_negotiations` add unique `available_capacity_negotiations_apply_detail_id_unique`(`apply_detail_id`);',
    );

    this.addSql(
      'create table `available_capacity_negotiation_details` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `negotiation_id` int unsigned not null, `status` varchar(255) not null, `hour_capacities` json not null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql(
      'alter table `available_capacity_negotiation_details` add index `available_capacity_negotiation_details_negotiation_id_index`(`negotiation_id`);',
    );

    this.addSql(
      'alter table `available_capacity_negotiations` add constraint `available_capacity_negotiations_charging_station_id_foreign` foreign key (`charging_station_id`) references `charging_stations` (`id`) on update cascade;',
    );
    this.addSql(
      'alter table `available_capacity_negotiations` add constraint `available_capacity_negotiations_apply_detail_id_foreign` foreign key (`apply_detail_id`) references `available_capacity_negotiation_details` (`id`) on update cascade on delete set null;',
    );

    this.addSql(
      'alter table `available_capacity_negotiation_details` add constraint `available_capacity_negotiation_details_negotiation_id_foreign` foreign key (`negotiation_id`) references `available_capacity_negotiations` (`id`) on update cascade;',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `available_capacity_negotiation_details` drop foreign key `available_capacity_negotiation_details_negotiation_id_foreign`;',
    );

    this.addSql(
      'alter table `available_capacity_negotiations` drop foreign key `available_capacity_negotiations_apply_detail_id_foreign`;',
    );

    this.addSql('drop table if exists `available_capacity_negotiations`;');

    this.addSql(
      'drop table if exists `available_capacity_negotiation_details`;',
    );
  }
}
