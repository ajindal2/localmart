import { Test, TestingModule } from '@nestjs/testing';
import { SavedListingService } from './saved-listing.service';

describe('SavedListingService', () => {
  let service: SavedListingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedListingService],
    }).compile();

    service = module.get<SavedListingService>(SavedListingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
