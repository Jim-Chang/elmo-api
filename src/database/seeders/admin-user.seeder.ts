import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { UserEntity } from '../../elmo/adapter/out/entities/user.entity';
import { ADMIN_ROLE, POWER_USER_ROLE } from '../../elmo/application/user/types';
import { UserPasswordService } from '../../elmo/application/user/user-password.service';

export class AdminUserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const pwdService = new UserPasswordService();

    const adminEmail = process.env.CLOUD_ADMIN_EMAIL;
    const adminPassword = await pwdService.hash(
      process.env.CLOUD_ADMIN_PASSWORD,
    );
    const powerUserEmail = process.env.POWER_USER_EMAIL;
    const powerUserPassword = await pwdService.hash(
      process.env.POWER_USER_PASSWORD,
    );

    const adminUser = new UserEntity();
    adminUser.email = adminEmail;
    adminUser.password = adminPassword;
    adminUser.fullName = 'Cloud Admin User';
    adminUser.role = ADMIN_ROLE;

    const powerUser = new UserEntity();
    powerUser.email = powerUserEmail;
    powerUser.password = powerUserPassword;
    powerUser.fullName = 'Power User';
    powerUser.role = POWER_USER_ROLE;

    await em.persistAndFlush([adminUser, powerUser]);
  }
}
