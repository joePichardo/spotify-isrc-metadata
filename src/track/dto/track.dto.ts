import { IsNotEmpty, IsString } from 'class-validator';

export class IsrcDto {
  @IsString()
  @IsNotEmpty()
  isrc: string;
}

export class ArtistDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
