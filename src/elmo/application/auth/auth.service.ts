import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import {
  API_ACCESS_TOKEN_ALPHABET,
  API_ACCESS_TOKEN_EXPIRES_IN_DAYS,
  API_ACCESS_TOKEN_LENGTH,
  API_ACCESS_TOKEN_PREFIX,
} from '../../../constants';
import { AccessTokenEntity } from '../../adapter/out/entities/access-token.entity';
import { AccessToken } from './types';
import { DateTime } from 'luxon';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AccessTokenEntity)
    private readonly accessTokenRepository: EntityRepository<AccessTokenEntity>,
  ) {}

  async login(userId: number): Promise<AccessToken> {
    const accessToken = this.generateAccessToken();
    const expiredAt = DateTime.now().plus({
      days: API_ACCESS_TOKEN_EXPIRES_IN_DAYS,
    });

    // save access token
    const entity = this.accessTokenRepository.create({
      user: userId,
      token: accessToken,
      expiredAt: expiredAt.toJSDate(),
    });

    const em = this.accessTokenRepository.getEntityManager();
    await em.persistAndFlush(entity);

    return accessToken;
  }

  async getUserIdByAccessToken(token: AccessToken): Promise<number> {
    const expiredAfter = DateTime.now();

    try {
      const accessToken = await this.accessTokenRepository.findOneOrFail({
        token,
        expiredAt: { $gt: expiredAfter.toJSDate() },
      });
      return accessToken.user.id;
    } catch {
      throw new Error('Invalid access token');
    }
  }

  async invalidateAccessToken(token: AccessToken): Promise<void> {
    const entity = await this.accessTokenRepository.findOneOrFail({ token });
    const em = this.accessTokenRepository.getEntityManager();
    await em.removeAndFlush(entity);
  }

  async invalidateAllAccessTokenByUser(userId: number): Promise<void> {
    const accessTokens = await this.accessTokenRepository.find({
      user: userId,
    });
    const em = this.accessTokenRepository.getEntityManager();
    await em.removeAndFlush(accessTokens);
  }

  generateAccessToken(): AccessToken {
    // generate uuid part
    const generateCustomNanoid = customAlphabet(API_ACCESS_TOKEN_ALPHABET);
    const uuidLength = API_ACCESS_TOKEN_LENGTH - API_ACCESS_TOKEN_PREFIX.length;
    const uuidPart = generateCustomNanoid(uuidLength);

    return AccessToken.parse(`${API_ACCESS_TOKEN_PREFIX}${uuidPart}`);
  }
}
