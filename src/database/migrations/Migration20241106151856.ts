import { Migration } from '@mikro-orm/migrations';

export class Migration20241106151856 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      "alter table `users` modify `role` enum('admin', 'powerUser', 'supervisor') not null;",
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      "alter table `users` modify `role` enum('powerUser', 'supervisor') not null;",
    );
  }
}
