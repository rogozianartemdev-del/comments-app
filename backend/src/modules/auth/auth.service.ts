import {
    ConflictException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { JwtService } from '@nestjs/jwt';
  import { compare, hash } from 'bcrypt';
  import { Repository } from 'typeorm';
  import { User } from './user.entity';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(User) private readonly usersRepo: Repository<User>,
      private readonly jwt: JwtService,
    ) {}
  
    async register(dto: RegisterDto) {
      const existing = await this.usersRepo.findOne({
        where: [{ username: dto.username }, { email: dto.email }],
      });
      if (existing) {
        throw new ConflictException('There is already a user with this name or email.');
      }
  
      const passwordHash = await hash(dto.password, 10);
      const user = this.usersRepo.create({
        username: dto.username,
        email: dto.email,
        passwordHash,
      });
      await this.usersRepo.save(user);
  
      return this.buildToken(user);
    }
  
    async login(dto: LoginDto) {
      const user = await this.usersRepo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.username = :id OR user.email = :id', { id: dto.usernameOrEmail })
        .getOne();
  
      if (!user) throw new UnauthorizedException('Incorrect login details');
  
      const valid = await compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Incorrect login details');
  
      return this.buildToken(user);
    }
  
    private buildToken(user: User) {
      const payload = { sub: user.id, username: user.username };
      return {
        accessToken: this.jwt.sign(payload),
        user: { id: user.id, username: user.username, email: user.email },
      };
    }
  }