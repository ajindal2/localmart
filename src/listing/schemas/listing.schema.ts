import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';
import { LocationSchema } from '../../location/schemas/location.schema';

export type ListingDocument = HydratedDocument<Listing>;

enum MainCategory {
  Plants = "Plants",
  Produce = "Produce",
  Eggs = "Eggs",
  Honey = "Honey",
  Dairy = "Dairy",
  Other = "Other"
}

const subCategoryEnum = {
  Plants: [],
  Produce: [],
  Eggs: [], 
  Honey: [],
  Dairy: [],
  Other: []
};

@Schema()
export class Listing {
    @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
    _id?: Types.ObjectId;

    @Prop({ required: true })
    title: string;
  
    @Prop()
    description: string;
  
    @Prop({ required: true })
    price: number;

    @Prop({
        type: [String],
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length > 0;
          },
          message: props => `${props.value} must be an array with at least one image URL`
        },
        required: true
    })
    imageUrls: string[]; // URLs to the images
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Seller' })
    sellerId: Types.ObjectId;

    @Prop({
      required: true,
      enum: ['Available', 'Sold'],
      default: 'Available'
    })
    state: string;

    @Prop({ default: Date.now })
    dateCreated: Date; // Date when the listing was created
    
    @Prop({ required: true, type: LocationSchema })
    location: typeof LocationSchema;

    @Prop({
      required: true,
      type: {
        mainCategory: {
          type: String,
          enum: Object.values(MainCategory),
        },
        subCategories: [{
          type: String,
          validate: {
            validator: function (v) {
              // Ensure the subcategories match the enum depending on the main category
              // 'this' refers correctly to the document instance in a traditional function
              return subCategoryEnum[this.mainCategory].includes(v);
            },
            message: props => `${props.value} is not a valid subcategory for ${props.instance.mainCategory}`
          }
        }],
      }
    })
    category: {
      mainCategory: MainCategory;
      subCategories: string[];
    };
  }

export const ListingSchema = SchemaFactory.createForClass(Listing);

ListingSchema.index({ title: 'text' });
