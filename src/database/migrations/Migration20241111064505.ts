import { Migration } from '@mikro-orm/migrations';

export class Migration20241111064505 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table `load_sites` drop foreign key `load_sites_feed_line_id_foreign`;',
    );

    this.addSql(
      'alter table `charging_stations` drop foreign key `charging_stations_feed_line_id_foreign`;',
    );

    this.addSql(
      'alter table `load_sites` drop index `load_sites_feed_line_id_index`;',
    );

    this.addSql(
      'alter table `load_sites` change `feed_line_id` `feeder_id` int unsigned null;',
    );
    this.addSql(
      'alter table `load_sites` add constraint `load_sites_feeder_id_foreign` foreign key (`feeder_id`) references `feeders` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `load_sites` add index `load_sites_feeder_id_index`(`feeder_id`);',
    );

    this.addSql(
      'alter table `charging_stations` drop index `charging_stations_feed_line_id_index`;',
    );

    this.addSql(
      'alter table `charging_stations` change `feed_line_id` `feeder_id` int unsigned null;',
    );
    this.addSql(
      'alter table `charging_stations` add constraint `charging_stations_feeder_id_foreign` foreign key (`feeder_id`) references `feeders` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `charging_stations` add index `charging_stations_feeder_id_index`(`feeder_id`);',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `load_sites` drop foreign key `load_sites_feeder_id_foreign`;',
    );

    this.addSql(
      'alter table `charging_stations` drop foreign key `charging_stations_feeder_id_foreign`;',
    );

    this.addSql(
      'alter table `load_sites` drop index `load_sites_feeder_id_index`;',
    );

    this.addSql(
      'alter table `load_sites` change `feeder_id` `feed_line_id` int unsigned null;',
    );
    this.addSql(
      'alter table `load_sites` add constraint `load_sites_feed_line_id_foreign` foreign key (`feed_line_id`) references `feeders` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `load_sites` add index `load_sites_feed_line_id_index`(`feed_line_id`);',
    );

    this.addSql(
      'alter table `charging_stations` drop index `charging_stations_feeder_id_index`;',
    );

    this.addSql(
      'alter table `charging_stations` change `feeder_id` `feed_line_id` int unsigned null;',
    );
    this.addSql(
      'alter table `charging_stations` add constraint `charging_stations_feed_line_id_foreign` foreign key (`feed_line_id`) references `feeders` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `charging_stations` add index `charging_stations_feed_line_id_index`(`feed_line_id`);',
    );
  }
}
