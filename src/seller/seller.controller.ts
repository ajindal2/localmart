import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SellerService } from './seller.service';

@Controller('seller')
export class SellerController {
    constructor(private sellerService: SellerService) {}

  @Get('/:sellerId')
  async getListing(@Param('sellerId') sellerId: string) {
    const seller = await this.sellerService.getSeller(sellerId);
    if (!seller) throw new NotFoundException('Seller does not exist!');
    return seller;
  }
}

