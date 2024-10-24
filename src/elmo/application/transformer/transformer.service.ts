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

  async getTransformerById(id: number): Promise<TransformerEntity> {
    return await this.transformerRepository.findOne({ id });
  }
}
