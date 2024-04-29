// src/listings/dto/category.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsString, IsArray, Validate, ValidateNested, IsOptional } from 'class-validator';
import { CustomSubCategoryValidator } from '../validators/custom-subcategory.validator';

export enum MainCategory {
  Plants = "Plants",
  Produce = "Produce",
  Eggs = "Eggs",
  Honey = "Honey",
  Dairy = "Dairy",
  Other = "Other"
}

const SubCategoryEnum = {
  Plants: [],
  Produce: [],
  Eggs: [],
  Honey: [],
  Dairy: [],
  Other: []
};

export class CategoryDTO {
  @IsEnum(MainCategory)
  mainCategory: MainCategory;

  @IsArray()
  @IsString({ each: true })
  @Validate(CustomSubCategoryValidator, { each: true })
  @IsOptional()
  subCategories?: string[]; // Directly using an array of strings
}
