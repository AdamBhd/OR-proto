import { Schema, model, Document, Types } from 'mongoose';

/**
 * Role-Based Access Control roles.
 * - ADMIN: Super-admin — global config, A/B flags, cross-tenant analytics.
 * - OWNER: Restaurant partner (vendor) — manages a single restaurant document.
 * - CUSTOMER: End user.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  CUSTOMER = 'CUSTOMER',
}

export interface IUser extends Document {
  email: string;
  /** Hashed password — auth layer is wired separately. */
  passwordHash: string;
  displayName: string;
  role: UserRole;
  /** Populated only for OWNER users — the restaurant they manage. */
  restaurantId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.CUSTOMER,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: false,
    },
  },
  { timestamps: true }
);

// An owner must point at exactly one restaurant.
UserSchema.path('restaurantId').validate(function (this: IUser, value) {
  if (this.role === UserRole.OWNER) return !!value;
  return true;
}, 'restaurantId is required for OWNER users.');

export const UserModel = model<IUser>('User', UserSchema);
