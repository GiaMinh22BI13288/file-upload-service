import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'; 
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(username: string, pass: string) {
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await this.usersRepo.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('Username đã tồn tại, vui lòng chọn tên khác');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(pass, 10);
    
    // Lưu vào DB
    const user = this.usersRepo.create({ username, password: hashedPassword });
    return this.usersRepo.save(user);
  }

  async login(username: string, pass: string) {
    // Tìm user trong DB
    const user = await this.usersRepo.findOne({ where: { username } });
    
    // Kiểm tra mật khẩu
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // Tạo Payload cho Token (sub là chuẩn JWT cho ID)
    const payload = { username: user.username, sub: user.id };
    
    // Trả về Token
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}