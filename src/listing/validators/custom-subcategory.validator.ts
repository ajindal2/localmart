// src/listings/validators/custom-subcategory.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ async: true })
export class CustomSubCategoryValidator implements ValidatorConstraintInterface {
  validate(subCategories: string[], args: ValidationArguments) {
    const { object } = args; // Access the entire object
    const mainCategory = (object as any).mainCategory;
    const allowedSubCategories = subCategories[mainCategory] || [];
    return subCategories.every(subCategory => allowedSubCategories.includes(subCategory));
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.value} is not a valid subcategory for the selected main category`;
  }
}
