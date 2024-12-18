import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { API_USER_PASSWORD_SALT_LENGTH } from '../../../constants';

@Injectable()
export class UserPasswordService {
  async hash(plain: string): Promise<string> {
    return await hash(plain, API_USER_PASSWORD_SALT_LENGTH);
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return await compare(plain, hashed);
  }
}
