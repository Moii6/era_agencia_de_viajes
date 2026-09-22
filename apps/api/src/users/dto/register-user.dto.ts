import { IsEmail, IsString, MinLength } from 'class-validator';

// Public self-registration — no role field here on purpose: a self-signed-up
// user always gets AGENT, decided server-side (see UsersService.registerPublic).
export class RegisterUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
