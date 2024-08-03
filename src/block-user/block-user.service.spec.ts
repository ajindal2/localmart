import { Test, TestingModule } from '@nestjs/testing';
import { BlockUserService } from './block-user.service';

describe('BlockUserService', () => {
  let service: BlockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockUserService],
    }).compile();

    service = module.get<BlockUserService>(BlockUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
