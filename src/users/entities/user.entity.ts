import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; 

  @OneToMany(() => FileEntity, (file) => file.user)
  files: FileEntity[];

  @CreateDateColumn()
  createdAt: Date;
}