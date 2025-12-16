import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async logAction(userId: string, action: string, method: string, ip: string, status: string = 'SUCCESS') {
    // Lưu ý: userId ở đây phải là UUID khớp với bảng users
    const newLog = this.auditRepo.create({ 
      userId, 
      action, 
      method, 
      ip, 
      status 
    });
    return await this.auditRepo.save(newLog);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.auditRepo.findAndCount({
      // 👇 QUAN TRỌNG: Phải có dòng này mới lấy được thông tin User
      relations: ['user'], 
      
      // 👇 TỐI ƯU: Chỉ lấy username và fullName, không lấy password
      select: {
        user: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      
      order: { timestamp: 'DESC' },
      skip: skip,
      take: limit,
    });

    return { data, total };
  }
}