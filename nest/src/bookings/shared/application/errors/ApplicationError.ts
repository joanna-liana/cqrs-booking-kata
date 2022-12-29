interface ApplicationErrorProps {
  message: string;
  status: number;
}

export class ApplicationError extends Error {
  public readonly status: number;

  constructor(props: ApplicationErrorProps) {
    super(props.message);

    this.name = this.constructor.name;
    this.status = props.status;
  }
}
