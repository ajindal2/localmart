import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class ImageUploadService {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });
    }

    async uploadFile(userId: string, file: Express.Multer.File, type: 'profile' | 'listing'): Promise<string> {
        let keyPrefix = `${userId}/`;
        const extension = file.originalname.split('.').pop(); // Get file extension from original name

        if (type === 'profile') {
            keyPrefix += `profile/profile-pic.${extension}`; // For one profile pic only
        } else if (type === 'listing') {
            keyPrefix += `listing/${Date.now()}-${file.originalname}`;
        }

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: keyPrefix,
            Body: file.buffer,
            ContentType: file.mimetype,
            CacheControl: 'no-cache, max-age=0',
        };

        try {
            const data = await this.s3Client.send(new PutObjectCommand(uploadParams));
            return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        } catch (err) {
            console.error("Error uploading file: ", err);
            throw new Error("Failed to upload file");
        }
    }
}
