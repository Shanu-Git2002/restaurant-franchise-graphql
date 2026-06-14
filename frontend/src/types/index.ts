export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type OutletStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ReviewSource = 'GOOGLE' | 'WHATSAPP' | 'INTERNAL' | 'FACEBOOK' | 'ZOMATO' | 'SWIGGY';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type Permission = 'VIEW_DASHBOARD' | 'MANAGE_OUTLETS' | 'MANAGE_EMPLOYEES' | 'MANAGE_REVIEWS' | 'VIEW_ANALYTICS' | 'EXPORT_REPORTS' | 'MANAGE_SETTINGS';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Franchise {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  outletCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  status: OutletStatus;
  openingHours?: Record<string, { open: string; close: string }>;
  franchise: Franchise;
  manager?: User;
  employeeCount: number;
  totalReviews: number;
  averageRating?: number;
  reputationScore?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  user: User;
  outlet: Outlet;
  position: string;
  permissions: Permission[];
  salary?: number;
  hiredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  outlet: Outlet;
  source: ReviewSource;
  rating: number;
  content?: string;
  authorName: string;
  authorEmail?: string;
  authorPhone?: string;
  authorPhoto?: string;
  sentiment: Sentiment;
  isResponded: boolean;
  response?: string;
  respondedAt?: string;
  reviewDate: string;
  tags: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DashboardStats {
  totalOutlets: number;
  activeOutlets: number;
  totalEmployees: number;
  totalReviews: number;
  averageRating: number;
  totalRevenue: number;
  revenueGrowth: number;
  reviewGrowth: number;
  reputationScore: number;
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  responseRate: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  sourceDistribution: { source: ReviewSource; count: number; percentage: number; averageRating: number }[];
  trendData: { date: string; count: number; averageRating: number }[];
}
