import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UserPort } from './user.port';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

/**
 * Module for handling user-related operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UserRepository,
    UserService,
    { provide: UserPort, useExisting: UserService },
  ],
  exports: [UserPort],
})
export class UserModule {}
