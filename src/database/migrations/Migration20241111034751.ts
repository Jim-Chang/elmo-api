import { Migration } from '@mikro-orm/migrations';

export class Migration20241111034751 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table `load_sites` drop foreign key `load_sites_feed_line_id_foreign`;',
    );

    this.addSql(
      'alter table `charging_stations` drop foreign key `charging_stations_feed_line_id_foreign`;',
    );

    this.addSql('rename table `feed_lines` to `feeders`;');

    this.addSql(
      'alter table `feeders` add index `feeders_district_id_index`(`district_id`);',
    );

    this.addSql(
      'alter table `feeders` add constraint `feeders_district_id_foreign` foreign key (`district_id`) references `districts` (`id`) on update cascade on delete set null;',
    );

    this.addSql(
      'alter table `load_sites` add constraint `load_sites_feed_line_id_foreign` foreign key (`feed_line_id`) references `feeders` (`id`) on update cascade on delete set null;',
    );

    this.addSql(
      'alter table `charging_stations` add constraint `charging_stations_feed_line_id_foreign` foreign key (`feed_line_id`) references `feeders` (`id`) on update cascade on delete set null;',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `load_sites` drop foreign key `load_sites_feed_line_id_foreign`;',
    );

    this.addSql(
      'alter table `charging_stations` drop foreign key `charging_stations_feed_line_id_foreign`;',
    );

    this.addSql('rename table `feeders` to `feed_lines`;');

    this.addSql(
      'alter table `feed_lines` add index `feed_lines_district_id_index`(`district_id`);',
    );

    this.addSql(
      'alter table `feed_lines` add constraint `feed_lines_district_id_foreign` foreign key (`district_id`) references `districts` (`id`) on update cascade on delete set null;',
    );

    this.addSql(
      'alter table `load_sites` add constraint `load_sites_feed_line_id_foreign` foreign key (`feed_line_id`) references `feed_lines` (`id`) on update cascade on delete set null;',
    );

    this.addSql(
      'alter table `charging_stations` add constraint `charging_stations_feed_line_id_foreign` foreign key (`feed_line_id`) references `feed_lines` (`id`) on update cascade on delete set null;',
    );
  }
}
