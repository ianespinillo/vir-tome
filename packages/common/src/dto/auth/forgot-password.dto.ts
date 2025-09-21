import { IsEmail, isEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDTO {
  @IsNotEmpty({
    message: "El correo es requerrido",
  })
  @IsEmail(
    {},
    {
      message: "Debe ingresar un correo valido",
    }
  )
  email!: string;
}
