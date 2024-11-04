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
    it('當密碼正確時，結果為 true', async () => {
      const plainPassword = '123456';
      const hashedPassword = await service.hash(plainPassword);

      const result = await service.verify(plainPassword, hashedPassword);
      return expect(result).toBeTruthy();
    });

    it('當密碼錯誤時，結果為 false', async () => {
      const plainPassword = '123456';
      const wrongPassword = '654321';
      const hashedPassword = await service.hash(plainPassword);

      const result = await service.verify(wrongPassword, hashedPassword);
      return expect(result).toBeFalsy();
    });
  });
});
