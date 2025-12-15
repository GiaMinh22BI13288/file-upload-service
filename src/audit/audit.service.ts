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

  // 1. Cập nhật hàm logAction để nhận thêm status
  async logAction(userId: string, action: string, method: string, ip: string, status: string = 'SUCCESS') {
    const newLog = this.auditRepo.create({ 
      userId, 
      action, 
      method, 
      ip, 
      status // Lưu status vào DB
    });
    return await this.auditRepo.save(newLog);
  }

  // 2. Cập nhật hàm findAll để Join bảng User lấy fullName
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.auditRepo.findAndCount({
      relations: ['user'], // <--- Lấy thêm thông tin User
      order: { timestamp: 'DESC' },
      skip: skip,
      take: limit,
    });

    return { data, total };
  }
}