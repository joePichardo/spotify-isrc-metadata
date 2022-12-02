import { IsNotEmpty, IsString } from 'class-validator';

export class IsrcDto {
  @IsString()
  @IsNotEmpty()
  isrc: string;
}
