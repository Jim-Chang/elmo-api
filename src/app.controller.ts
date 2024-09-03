import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RegisterDto } from './dto/register.dto';
import { ZodValidationPipe } from '@anatine/zod-nestjs';

@Controller()
@UsePipes(ZodValidationPipe)
export class AppController {
  private logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register POST, body: ${JSON.stringify(registerDto)}`,
    );
  }

  @Put('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateRegister(@Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register PUT, body: ${JSON.stringify(registerDto)}`,
    );
  }

  @Delete('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRegister(@Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register DELETE, body: ${JSON.stringify(registerDto)}`,
    );
  }
}
