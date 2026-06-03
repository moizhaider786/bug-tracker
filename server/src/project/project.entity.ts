import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Users } from '../user/user.entity';
import { Projects_Users } from './project_user.entity';

@Entity()
export class Projects {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: false })
  createdBy!: number;

  @ManyToOne(() => Users, (user) => user.createdProjects)
  @JoinColumn({ name: 'createdBy' })
  creator!: Users;

  @OneToMany(() => Projects_Users, (projectUser) => projectUser.project)
  projectUsers!: Projects_Users[];

  @CreateDateColumn()
  createdAt!: Date;
}
