import {
  Controller,
  Post,
  Body,
  Req,
  Param,
  Patch,
  Get,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProjectService } from './project.service';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRoles } from 'src/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { MembersDto } from './dto/members.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(UserRoles.MANAGER)
  async create(
    @Req() req: Request,
    @Body() body: Omit<CreateProjectDto, 'createdBy'>,
  ) {
    const data = { createdBy: req.user!.id, ...body };
    return await this.projectService.createProject(data);
  }

  @Get()
  async getProjects(@Req() req: Request) {
    return await this.projectService.getUserProjects(
      req.user!.id,
      req.user!.role,
    );
  }

  @Get(':id')
  async getProjectDetails(@Param('id') id: number) {
    return await this.projectService.getById(id);
  }

  @Patch(':id')
  @Roles(UserRoles.MANAGER)
  async update(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() body: UpdateProjectDto,
  ) {
    return await this.projectService.updateProject(body, id, req.user!.id);
  }

  @Post(':id/members')
  @Roles(UserRoles.MANAGER)
  async addMembers(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() body: MembersDto,
  ) {
    await this.projectService.addMembers(id, req.user!.id, body.members);
    return { message: 'Members added successfully' };
  }

  @Delete(':id/members')
  @Roles(UserRoles.MANAGER)
  async removeMembers(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() body: MembersDto,
  ) {
    await this.projectService.removeMembers(id, req.user!.id, body.members);
    return { message: 'Members removed successfully' };
  }

  @Get(':id/members')
  async getProjectMembers(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Query('role') role?: UserRoles,
  ) {
    return await this.projectService.getProjectMembers(id, req.user!.id, role);
  }
}
