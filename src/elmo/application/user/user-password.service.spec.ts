import { Test, TestingModule } from '@nestjs/testing';
import { UserPasswordService } from './user-password.service';

describe('UserPasswordService', () => {
  let service: UserPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPasswordService],
    }).compile();

    service = module.get<UserPasswordService>(UserPasswordService);
  });

  describe('verify', () => {
    it('當密碼正確時，不應拋出錯誤', async () => {
      const plainPassword = '123456';
      const hashedPassword = await service.hash(plainPassword);

      await expect(
        service.verify(plainPassword, hashedPassword),
      ).resolves.not.toThrow();
    });

    it('當密碼錯誤時，應拋出錯誤', async () => {
      const plainPassword = '123456';
      const wrongPassword = '654321';
      const hashedPassword = await service.hash(plainPassword);

      await expect(
        service.verify(wrongPassword, hashedPassword),
      ).rejects.toThrow('password not correct');
    });
  });
});
