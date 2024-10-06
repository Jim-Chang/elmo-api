import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { CsmsEntity } from '../../adapter/out/entities/csms.entity';
import { customAlphabet } from 'nanoid';
import { OSCP_TOKEN_ALPHABET, OSCP_TOKEN_LENGTH } from '../../../constants';

@Injectable()
export class CsmsService {
  constructor(
    @InjectRepository(CsmsEntity)
    private readonly csmsRepo: EntityRepository<CsmsEntity>,
  ) {}

  async findById(csmsId: number): Promise<CsmsEntity> {
    return await this.csmsRepo.findOne(csmsId);
  }

  async findByOscpElmoToken(oscpElmoToken: string): Promise<CsmsEntity> {
    return await this.csmsRepo.findOne({ oscpElmoToken });
  }

  async register(
    csmsId: number,
    oscpCsmsToken: string,
    oscpBaseUrl: string,
  ): Promise<void> {
    await this.csmsRepo.nativeUpdate(
      { id: csmsId },
      {
        oscpCsmsToken,
        oscpBaseUrl,
      },
    );
  }

  async unregister(csmsId: number): Promise<void> {
    await this.csmsRepo.nativeUpdate(
      { id: csmsId },
      {
        oscpCsmsToken: null,
        oscpBaseUrl: null,
        isConnected: false,
      },
    );
  }

  async setConnected(csmsId: number): Promise<void> {
    await this.csmsRepo.nativeUpdate(
      { id: csmsId },
      {
        isConnected: true,
      },
    );
  }

  async generateAndSaveOscpElmoToken(csmsId: number): Promise<string> {
    const token = generateOscpToken();
    await this.csmsRepo.nativeUpdate(
      { id: csmsId },
      {
        oscpElmoToken: token,
      },
    );
    return token;
  }
}

function generateOscpToken(): string {
  const generateToken = customAlphabet(OSCP_TOKEN_ALPHABET);
  return generateToken(OSCP_TOKEN_LENGTH);
}
