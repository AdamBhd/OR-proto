import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, UserRole, IUser } from '../models/User.model';
import { env } from '../config/env';

export interface JwtPayloadShape {
  id: string;
  role: UserRole;
  restaurantId?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
  restaurantId?: string;
}

/**
 * Authentication / authorization service.
 * Owns password hashing and JWT issuance — controllers never touch bcrypt or jwt directly.
 */
export class AuthService {
  private readonly bcryptRounds = 12;
  private readonly jwtExpiresIn: SignOptions['expiresIn'] = '7d';

  async register(input: RegisterInput): Promise<IUser> {
    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);
    const user = await UserModel.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      role: input.role ?? UserRole.CUSTOMER,
      restaurantId: input.restaurantId,
    });
    return user;
  }

  async login(email: string, password: string): Promise<{ token: string; user: IUser } | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    return { token: this.signToken(user), user };
  }

  signToken(user: IUser): string {
    const payload: JwtPayloadShape = {
      id: String(user._id),
      role: user.role,
      restaurantId: user.restaurantId ? String(user.restaurantId) : undefined,
    };
    return jwt.sign(payload, env.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  verifyToken(token: string): JwtPayloadShape {
    return jwt.verify(token, env.jwtSecret) as JwtPayloadShape;
  }
}

export const authService = new AuthService();
