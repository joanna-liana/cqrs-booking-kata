import { HttpException } from '@nestjs/common';

interface ApplicationErrorProps {
  message: string;
  status: number;
}

export class ApplicationError extends HttpException {
  constructor(props: ApplicationErrorProps) {
    super(props.message, props.status);

    this.name = this.constructor.name;
  }
}
