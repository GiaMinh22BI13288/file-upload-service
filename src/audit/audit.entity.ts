import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Đảm bảo đường dẫn import đúng

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Quan hệ: Nhiều Log thuộc về 1 User
  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'userId' }) // Khóa ngoại là cột userId
  user: User;

  @Column({ nullable: true })
  userId: string; // Vẫn giữ cột này để lưu ID nhanh (kể cả khi user đó bị xóa sau này)

  @Column()
  action: string;

  @Column()
  method: string;

  @Column({ nullable: true })
  ip: string;

  // Thêm cột trạng thái (Mặc định là SUCCESS)
  @Column({ default: 'SUCCESS' })
  status: string; 

  @CreateDateColumn()
  timestamp: Date;
}