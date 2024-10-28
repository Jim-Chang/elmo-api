import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { TransformerEntity } from '../../adapter/out/entities/transformer.entity';

@Injectable()
export class TransformerService {
  constructor(
    @InjectRepository(TransformerEntity)
    private readonly transformerRepository: EntityRepository<TransformerEntity>,
  ) {}

  async getAllTransformers(): Promise<TransformerEntity[]> {
    return await this.transformerRepository.findAll();
  }

  async getUid(id: number): Promise<string> {
    const transformer = await this.transformerRepository.findOneOrFail({ id });
    return transformer.uid;
  }

  async getTransformerById(id: number): Promise<TransformerEntity> {
    return await this.transformerRepository.findOne({ id });
  }
}
