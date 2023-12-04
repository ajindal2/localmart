import { Test, TestingModule } from '@nestjs/testing';
import { UserprofileController } from './userProfile.controller';

describe('UserprofileController', () => {
  let controller: UserprofileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserprofileController],
    }).compile();

    controller = module.get<UserprofileController>(UserprofileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
