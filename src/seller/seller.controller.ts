import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Delete } from '@nestjs/common';
import { SellerService } from './seller.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateSellerDTO } from './dtos/create-seller.dto';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createSellerDto: CreateSellerDTO) {
    try {
      const seller = await this.sellerService.create(createSellerDto);
      return seller;
    } catch (error) {
      throw new HttpException('Error creating seller', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/:id')
  async getSeller(@Param('id') sellerId: string) {
    try {
      const seller = await this.sellerService.findById(sellerId);
      return seller;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete('/:id')
  //@UseGuards(JwtAuthGuard)
  async deleteSellerProfile(@Param('id') sellerId: string) {
    await this.sellerService.deleteSeller(sellerId);
  }

  @Get('/:userId/location')
  async getSellerLocation(@Param('userId') userId: string) {
    return this.sellerService.getSellerLocation(userId);
  }}


