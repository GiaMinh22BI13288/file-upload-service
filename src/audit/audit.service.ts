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

  async logAction(userId: string, action: string, method: string, ip: string) {
    const log = this.auditRepo.create({ userId, action, method, ip });
    await this.auditRepo.save(log);
  }
  async findAll() {
  return this.auditRepo.find({ order: { timestamp: 'DESC' } });
  }
}