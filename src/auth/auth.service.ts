import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { Profile } from 'passport-spotify';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    // generate the password hash
    const hash = await argon.hash(dto.password);
    try {
      // save the new user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      delete user.hash;

      //return the saved user
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials Taken');
        }
      }

      throw error;
    }
  }

  async signin(dto: AuthDto) {
    // find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException('Credentials incorrect');

    // compare password
    const pwMatches = await argon.verify(user.hash, dto.password);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    delete user.hash;

    // send back the user
    return this.signToken(user.id, user.email);
  }

  async spotifyLogin(req, res) {
    const {
      user,
      authInfo,
    }: {
      user: Profile;
      authInfo: {
        accessToken: string;
        refreshToken: string;
        expires_in: number;
      };
    } = req;

    if (!user) {
      res.redirect('/');
      return;
    }

    let currentUser;
    // find the user by email
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email: user._json.email,
      },
    });

    // if user does not exist create user
    if (!foundUser) {
      const newUser = await this.prisma.user.create({
        data: {
          email: user._json.email,
        },
      });
      currentUser = newUser;
    } else {
      currentUser = foundUser;
    }

    req.user = undefined;

    await this.prisma.user.update({
      where: {
        email: user._json.email,
      },
      data: {
        spotifyAuthToken: authInfo.accessToken,
        spotifyRefreshToken: authInfo.refreshToken,
      },
    });

    const jwt = await this.signToken(currentUser.id, currentUser.email);

    res.set('authorization', `Bearer ${jwt}`);

    return res.status(201).json({ jwt, authInfo, user });
  }

  spotifyJwt(user: Profile) {
    const payload = {
      name: user._json.email,
      sub: user.id,
    };

    const secret = this.config.get('JWT_SECRET');

    return this.jwt.sign(payload, {
      expiresIn: '15m',
      secret,
    });
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return {
      access_token: token,
    };
  }
}
