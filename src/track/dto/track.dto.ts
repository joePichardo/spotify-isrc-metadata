import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IsrcDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  isrc: string;
}

export class ArtistDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;
}
