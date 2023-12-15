import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Seller } from './schemas/seller.schema';
import { Model } from 'mongoose';
import { CreateSellerDTO } from './dtos/create-seller.dto';

@Injectable()
export class SellerService {
    constructor(
        @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
        ) { }

  async create(createSellerDto: CreateSellerDTO): Promise<Seller> {
    const newSeller = new this.sellerModel(createSellerDto);
    return newSeller.save();
  }

  async findById(sellerId: string): Promise<Seller> {
    const seller = await this.sellerModel.findById(sellerId).exec();
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }
    return seller;
  }
}