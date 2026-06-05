import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { BugModule } from './bug/bug.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UserModule,
    AuthModule,
    ProjectModule,
    BugModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
