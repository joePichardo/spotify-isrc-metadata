import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtGuard } from 'src/auth/guard';
import { User } from '.prisma/client';
import { GetUser } from '../auth/decorator';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  getMe(@GetUser() user: User) {
    return user;
  }
}
