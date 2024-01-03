import { Test, TestingModule } from '@nestjs/testing';
import { SavedListingController } from './saved-listing.controller';

describe('SavedListingController', () => {
  let controller: SavedListingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedListingController],
    }).compile();

    controller = module.get<SavedListingController>(SavedListingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
