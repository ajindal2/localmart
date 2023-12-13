import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller } from './schemas/seller.schema';

@Injectable()
export class SellerService {
    constructor(
        @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>
        ) { }
        
    async getSeller(id: string): Promise<Seller> {
        const listing = await this.sellerModel.findById(id).exec();
        return listing;
      }
}
