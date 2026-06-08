import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Req,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRoles } from 'src/types';
import { BugService } from './bug.service';
import { CreateBugDto } from './dto/create-bug.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from 'src/supabase/supabase.service';
import 'multer';

@Controller('bug')
export class BugController {
  constructor(
    private readonly bugService: BugService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post()
  @Roles(UserRoles.QA)
  async create(@Body() data: CreateBugDto) {
    return await this.bugService.createBug(data);
  }

  @Get()
  async getUserBugs(
    @Req() req: Request,
    @Query('projectId') projectId?: number,
  ) {
    return await this.bugService.getBugs(
      req.user!.id,
      req.user!.role,
      projectId,
    );
  }
  @Get(':id')
  async getBugById(@Req() req: Request, @Param('id') id: number) {
    return await this.bugService.getBugById(id);
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() data: Partial<CreateBugDto>,
  ) {
    return await this.bugService.updateBug(
      id,
      req.user!.id,
      req.user!.role,
      data,
    );
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: number) {
    return await this.bugService.deleteBug(id, req.user!.id, req.user!.role);
  }

  @Post('/:id/screenshot')
  @UseInterceptors(FileInterceptor('file'))
  async uploadScreenshot(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /image\/(png|gif)/ })],
      }),
    )
    file: Express.Multer.File,
    @Param('id') id: number,
  ) {
    console.log('file ', file);
    const fileName = `${id}-${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from('bug-tracker-bucket')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.log('error ', error);
      throw new InternalServerErrorException(error.message);
    }
    const {
      data: { publicUrl },
    } = this.supabaseService
      .getClient()
      .storage.from('bug-tracker-bucket')
      .getPublicUrl(data.path);

    await this.bugService.updateBug(id, req.user!.id, req.user!.role, {
      screenShotUrl: publicUrl,
    });

    return { url: publicUrl };
  }
}
