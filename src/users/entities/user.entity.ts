import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity';
import { AuditLog } from '../../audit/audit.entity'; // Import AuditLog

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;
  
  // Thêm cột Họ tên
  @Column({ nullable: true })
  fullName: string; 

  @Column()
  password: string;

  // Quan hệ với Files
  @OneToMany(() => FileEntity, (file) => file.user)
  files: FileEntity[];

  // Quan hệ với AuditLogs (1 User có nhiều Logs)
  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @CreateDateColumn()
  createdAt: Date;
}