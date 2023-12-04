import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/schemas/user.schema';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { RefreshToken } from './schemas/refresh-token.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel('RefreshToken') private readonly refreshTokenModel: Model<RefreshToken>,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if(user) {
      const isPasswordMatch = await bcrypt.compare(
        password,
        user.password
      );
      if(isPasswordMatch) {
        return user;
      }
    }
    return null;
    }

  async login(user: any) {
    const payload = { username: user.userName, sub: user._id };
    return {
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.emailAddress,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<any> {
    const refreshTokenRecord = await this.refreshTokenModel.findOne({
      userId,
      refreshToken,
    });

    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshTokenRecord.expires < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userService.findByUserId(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async createAccessToken(user: any): Promise<string> {
    return this.jwtService.sign({ userId: user.id, username: user.username });
  }

  /*async register(createUserDto: CreateUserDTO): Promise<{ user: User; token: string }> {
    try {
      const user = await this.userService.createUserProfile(createUserDto);
      const payload = { username: user.userName, sub: user._id };
      return {
        user,
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error.code === '11000') { // MongoDB duplicate key error
        throw new ConflictException('Username or email already exists');
      }
      throw new NotFoundException(error);
    }
  }*/
}
