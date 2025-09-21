import { PasswordAdapter } from '@/core/passport-adapter';
import { EmailService } from '@/email/email.service';
import { TokensService } from '@/tokens/tokens.service';
import { UserEntity } from '@/users/entities/user.entity';
import { UsersService } from '@/users/services/users.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ForgotPasswordDTO,
  IAuthPayload,
  SignInDto,
  SignUpDto,
  TokenTypes,
  UpdatePasswordDto,
  UpdatePersonalDataDto,
} from '@repo/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokensService,
  ) {}

  async signUp(payload: SignUpDto) {
    const user = await this.usersService.findUserByEmail(payload.email);
    if (user) {
      throw new BadRequestException('Email ya en uso');
    }
    return await this.usersService.createUser(payload);
  }
  async signIn(payload: SignInDto) {
    const user = await this.usersService.findUserByEmail(payload.email);
    if (!user) {
      throw new BadRequestException('Email no encontrado');
    }
    const isPasswordValid = await PasswordAdapter.comparePassword(
      payload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña incorrecta');
    }
    const jwtPayload: IAuthPayload = {
      sub: user.id,
      email: user.email,
    };
    const token = this.jwtService.sign(jwtPayload);

    return {
      token: token.toString(),
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
      },
    };
  }
  async generateChangeEmailToken(user_id: number, data: UpdatePersonalDataDto) {
    const user = (await this.usersService.findById(user_id)) as UserEntity;

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const fieldsToCompare = ['name', 'surname', 'email'] as const;
    const isEqual = fieldsToCompare.every((field) => {
      return data[field] === user[field];
    });

    // Si no hay cambios, no hacemos nada
    if (isEqual) {
      throw new BadRequestException('No hay cambios para actualizar');
    }
    // Si el nombre o apellido cambiaron, actualizar directamente
    if (
      (data.name && data.name !== user.name) ||
      (data.surname && data.surname !== user.surname)
    ) {
      await this.usersService.update(user_id, data);
    }
    // Si el email cambió, generar token de confirmación
    if (data.email && data.email !== user.email) {
      const jwtPayload = {
        user_id: user.id,
        new_email: data.email,
        purpose: 'change_email',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = this.jwtService.sign(jwtPayload, {
        expiresIn: '1h', // Token expira en 1 hora
      });

      const confirmation_url = `${process.env.FRONTEND_URL}/auth/confirm-email?token=${token}`;

      const emailData = {
        confirmation_url,
        expiration: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora
        name: user.name,
        new_email: data.email,
        old_email: user.email,
        token,
      };

      await this.emailService.sendEmailChangeEmail(emailData);

      return {
        confirmation_url,
        expiration: emailData.expiration,
      };
    }

    return {
      message: 'Datos personales actualizados correctamente',
    };
  }
  async confirmEmail(token: string) {
    const isValid = this.jwtService.verify(token);
    if (!isValid) throw new BadRequestException('Token invalido');
    const payload = this.jwtService.decode(token);
    const user_id = payload.user_id;
    const new_email = payload.new_email;
    const user = await this.usersService.findById(user_id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.email = new_email;
    await this.usersService.update(user_id, user);
    await this.emailService.sendEmailChangeConfirmation({
      name: user.name,
      new_email: new_email,
    });
    return {
      message: 'Correo electronico confirmado',
    };
  }
  async changePassword(user_id: number, data: UpdatePasswordDto) {
    const user = await this.usersService.findById(user_id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const isPasswordValid = await PasswordAdapter.comparePassword(
      data.old_password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña incorrecta');
    }
    if (data.new_password !== data.confirm_new_password) {
      throw new BadRequestException('Las contrasenas no coinciden');
    }
    user.password = await PasswordAdapter.hashPassword(data.new_password);
    await this.usersService.update(user_id, user);
    return {
      message: 'Contraseña actualizada correctamente',
    };
  }
  async forgotPassword({ email }: ForgotPasswordDTO) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const {expires, token} = await this.tokenService.generateToken({
		expiresInHours: 2,
		user_id: user.id,
		type: TokenTypes.FORGOT_PASSWORD
	});
	await this.emailService.forgotPasswordEmail({
		email: user.email,
		token,
		expires
	})
	return{
		message: "Correo enviado satisfactoriamente"
	}
  }
}
