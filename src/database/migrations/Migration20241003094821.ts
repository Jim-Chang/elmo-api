import { Migration } from '@mikro-orm/migrations';

export class Migration20241003094821 extends Migration {
  override async up(): Promise<void> {
    // 在 alter table 之前，先刪除 available_capacity_emergencies table 的所有資料
    this.addSql('DELETE FROM `available_capacity_emergencies`');

    this.addSql(
      'alter table `available_capacity_negotiations` add `last_emergency_id` int unsigned null;',
    );
    this.addSql(
      'alter table `available_capacity_negotiations` add constraint `available_capacity_negotiations_last_emergency_id_foreign` foreign key (`last_emergency_id`) references `available_capacity_emergencies` (`id`) on update cascade on delete set null;',
    );
    this.addSql(
      'alter table `available_capacity_negotiations` add unique `available_capacity_negotiations_last_emergency_id_unique`(`last_emergency_id`);',
    );

    this.addSql(
      'alter table `available_capacity_emergencies` add `negotiation_id` int unsigned not null;',
    );
    this.addSql(
      'alter table `available_capacity_emergencies` add constraint `available_capacity_emergencies_negotiation_id_foreign` foreign key (`negotiation_id`) references `available_capacity_negotiations` (`id`) on update cascade;',
    );
    this.addSql(
      'alter table `available_capacity_emergencies` add index `available_capacity_emergencies_negotiation_id_index`(`negotiation_id`);',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table `available_capacity_negotiations` drop foreign key `available_capacity_negotiations_last_emergency_id_foreign`;',
    );

    this.addSql(
      'alter table `available_capacity_emergencies` drop foreign key `available_capacity_emergencies_negotiation_id_foreign`;',
    );

    this.addSql(
      'alter table `available_capacity_negotiations` drop index `available_capacity_negotiations_last_emergency_id_unique`;',
    );
    this.addSql(
      'alter table `available_capacity_negotiations` drop column `last_emergency_id`;',
    );

    this.addSql(
      'alter table `available_capacity_emergencies` drop index `available_capacity_emergencies_negotiation_id_index`;',
    );
    this.addSql(
      'alter table `available_capacity_emergencies` drop column `negotiation_id`;',
    );
  }
}
