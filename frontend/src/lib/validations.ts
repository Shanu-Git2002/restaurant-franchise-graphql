import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const createOutletSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India'),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  managerId: z.string().optional(),
});

export const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  outletId: z.string().min(1, 'Outlet is required'),
  position: z.string().min(2, 'Position is required'),
  salary: z.number().positive('Must be positive').optional(),
});

export const createReviewSchema = z.object({
  outletId: z.string().min(1, 'Outlet is required'),
  source: z.enum(['GOOGLE', 'WHATSAPP', 'INTERNAL', 'FACEBOOK', 'ZOMATO', 'SWIGGY']),
  rating: z.number().min(1).max(5),
  content: z.string().optional(),
  authorName: z.string().min(2, 'Author name is required'),
  authorEmail: z.string().email().optional().or(z.literal('')),
  reviewDate: z.string().min(1, 'Review date is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateOutletInput = z.infer<typeof createOutletSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
