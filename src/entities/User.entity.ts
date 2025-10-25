import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gender } from '../types';
import { Follow } from './Follow.entity';
import { Message } from './Message.entity';
import { RefreshToken } from './RefreshToken.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'date' })
  date_of_birth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({ type: 'varchar', length: 500, nullable: true })
  height: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'text', nullable: true })
  interests: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_picture: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'boolean', default: false })
  is_online: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_seen: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  reset_token_expires: Date | null;

  // FCM Token for push notifications
  @Column({ type: 'varchar', length: 500, nullable: true })
  fcm_token: string | null;

  // Notification preferences
  @Column({ type: 'boolean', default: true })
  notifications_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => Message, (message) => message.sender)
  sent_messages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  received_messages: Message[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens: RefreshToken[];
}