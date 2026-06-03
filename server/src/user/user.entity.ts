import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { UserRoles } from 'src/types';
import { Projects } from 'src/project/project.entity';
import { Projects_Users } from 'src/project/project_user.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false, length: 100 })
  password!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'enum', enum: UserRoles, nullable: false })
  role!: UserRoles;

  @OneToMany(()=>Projects, (project)=>project.creator)
  createdProjects!: Projects[]

  @OneToMany(()=>Projects_Users, (projectUser)=>projectUser.user)
  assignedProjects!: Projects_Users[]

  @CreateDateColumn()
  createdAt!: Date;
}
