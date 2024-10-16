import { Migration } from '@mikro-orm/migrations';

export class Migration20241016070129 extends Migration {

  override async up(): Promise<void> {
    this.addSql('create table `transformers` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `load_site_id` int unsigned null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `transformers` add index `transformers_load_site_id_index`(`load_site_id`);');

    this.addSql('alter table `transformers` add constraint `transformers_load_site_id_foreign` foreign key (`load_site_id`) references `load_sites` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `feed_lines` add `district_id` int unsigned null;');
    this.addSql('alter table `feed_lines` add constraint `feed_lines_district_id_foreign` foreign key (`district_id`) references `districts` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `feed_lines` add index `feed_lines_district_id_index`(`district_id`);');

    this.addSql('alter table `load_sites` add `feed_line_id` int unsigned null;');
    this.addSql('alter table `load_sites` add constraint `load_sites_feed_line_id_foreign` foreign key (`feed_line_id`) references `feed_lines` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `load_sites` add index `load_sites_feed_line_id_index`(`feed_line_id`);');
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `transformers`;');

    this.addSql('alter table `feed_lines` drop foreign key `feed_lines_district_id_foreign`;');

    this.addSql('alter table `load_sites` drop foreign key `load_sites_feed_line_id_foreign`;');

    this.addSql('alter table `feed_lines` drop index `feed_lines_district_id_index`;');
    this.addSql('alter table `feed_lines` drop column `district_id`;');

    this.addSql('alter table `load_sites` drop index `load_sites_feed_line_id_index`;');
    this.addSql('alter table `load_sites` drop column `feed_line_id`;');
  }

}
