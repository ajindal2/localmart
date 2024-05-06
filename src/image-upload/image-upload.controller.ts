import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadService } from './image-upload.service';


@Controller('image-upload')
export class ImageUploadController {
    constructor(private imageUploadService: ImageUploadService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const imageUrl = await this.imageUploadService.uploadFile(null, file, 'profile');
        return { imageUrl };
    }
}
