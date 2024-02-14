import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';


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
    const refreshToken = await this.createRefreshToken(user);

    return {
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.emailAddress,
      },
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async createAccessToken(user: any): Promise<string> {
    return this.jwtService.sign({ userId: user.id, username: user.username });
  }

  private async createRefreshToken(user: any): Promise<string> {
    try {
      const refreshToken = this.jwtService.sign({ userId: user._id }, { expiresIn: '7d' });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Set expiry date 7 days from now

      const refreshTokenDocument = new this.refreshTokenModel({
        token: refreshToken,
        userId: user._id,
        expiryDate,
        lastUsedAt: new Date(),
      });

      await refreshTokenDocument.save();

      return refreshToken;
    } catch (error) {
      console.error('Error in createRefreshToken:', error);
      throw error; // Re-throw the error so it can be caught and handled by the calling function
    }
  }

  async findRefreshToken(token: string): Promise<RefreshToken> {
    return this.refreshTokenModel.findOne({ token }).exec();
  }

  async validateRefreshToken(token: string): Promise<any> {
    try {
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      const refreshToken = await this.refreshTokenModel.findOne({ token }).exec();

      if (!refreshToken || refreshToken.userId.toString() !== payload.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Ensure the refresh token is not expired
      if (refreshToken.expiryDate < new Date()) {
        throw new UnauthorizedException('Expired refresh token');
      }

      const user = await this.userService.findByUserId(refreshToken.userId.toString());

      // Check if the user account is still active
      if (!user) {
          throw new UnauthorizedException('User account is inactive');
      }

      // Update the lastUsedAt field to the current time
      refreshToken.lastUsedAt = new Date();
      await refreshToken.save();

      return await this.userService.findByUserId(payload.userId);
    } catch (error) {
      console.error('Error in validateRefreshToken:', error);
      throw error; // Re-throw the error so it can be caught and handled by the calling function
    }
  }

  // Method to generate access token from refresh token
  async refreshToken(token: string): Promise<{ access_token: string, refresh_token: string }> {
    try {
      const user = await this.validateRefreshToken(token);
      if (!user) {
          throw new UnauthorizedException('Invalid refresh token');
      }

      // Invalidate the old refresh token
      await this.refreshTokenModel.deleteOne({ token });

      // Generate a new refresh token
      const newRefreshToken = await this.createRefreshToken(user);

      // Generate a new access token
      const newAccessToken = await this.createAccessToken(user);

      return {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
      };
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw error; // Re-throw the error so it can be caught and handled by the calling function
    }
  }
}
