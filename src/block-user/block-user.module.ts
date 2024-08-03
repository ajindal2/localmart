import { Module } from '@nestjs/common';
import { BlockUserService } from './block-user.service';
import { BlockUserController } from './block-user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/user/schemas/user.schema';
import { BlockUserSchema } from './schemas/block-user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'BlockUser', schema: BlockUserSchema }]),
  ],
  providers: [BlockUserService],
  exports: [BlockUserService],  // Export the service to make it available in other modules
  controllers: [BlockUserController]
})
export class BlockUserModule {}
