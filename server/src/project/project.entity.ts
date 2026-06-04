import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Users } from '../user/user.entity';
import { ProjectsToUsers } from './project-to-user.entity';

@Entity()
@Unique('UQ_NAME_CREATEDBY', ['name', 'createdBy'])
export class Projects {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: false})
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column()
  createdBy!: number;

  @ManyToOne(() => Users, (user) => user.createdProjects)
  @JoinColumn({ name: 'createdBy' })
  creator!: Users;

  @OneToMany(() => ProjectsToUsers, (projectUser) => projectUser.project)
  projectUsers!: ProjectsToUsers[];

  @CreateDateColumn()
  createdAt!: Date;
}
