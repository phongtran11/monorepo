import { User } from '@api/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity representing a user session, typically associated with a refresh token.
 * Stores information about the user, the token, and the environment (IP, user agent).
 */
@Entity('sessions')
export class Session {
  /**
   * Unique identifier for the session (JTI in the JWT).
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The ID of the user associated with this session.
   */
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  /**
   * The user entity associated with this session.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * The hashed refresh token.
   */
  @Column({ type: 'text', name: 'refresh_token' })
  refreshToken: string;

  /**
   * The IP address from which the session was created.
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  /**
   * The user agent string from which the session was created.
   */
  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string | null;

  /**
   * The timestamp when the session (refresh token) expires.
   */
  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  /**
   * The timestamp when the session was created.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  /**
   * The timestamp when the session was last updated.
   */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
