import { Test, TestingModule } from '@nestjs/testing';
import { OscpController } from './oscp.controller';

describe('OscpController', () => {
  let controller: OscpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OscpController],
    }).compile();

    controller = module.get<OscpController>(OscpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
