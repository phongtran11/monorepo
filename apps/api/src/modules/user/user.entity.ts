import { AccountStatus, Role } from '@lam-thinh-ecommerce/shared';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity representing a user in the system.
 */
@Entity('users')
export class User {
  /**
   * The unique identifier for the user.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The email of the user, used for login and notifications.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * The hashed password of the user.
   */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /**
   * The full name of the user.
   */
  @Column({ type: 'varchar', length: 255, name: 'full_name', nullable: true })
  fullName: string | null;

  /**
   * The phone number of the user.
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  /**
   * The role assigned to the user, defining their permissions.
   */
  @Column({ type: 'smallint', unsigned: true, default: Role.CUSTOMER })
  role: Role;

  /**
   * The current status of the user's account.
   */
  @Column({
    type: 'smallint',
    unsigned: true,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  /**
   * The date and time when the user was created.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  /**
   * The date and time when the user was last updated.
   */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  /**
   * The date and time when the user was deleted.
   */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
