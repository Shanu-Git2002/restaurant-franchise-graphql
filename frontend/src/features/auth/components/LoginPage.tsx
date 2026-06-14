import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { LOGIN_MUTATION } from '../api/auth.graphql';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/useToast';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, refreshToken, user } = data.login;
      setAuth(user, accessToken, refreshToken);
      toast({ title: 'Welcome back!', description: `Hello, ${user.firstName}!`, variant: 'default' });
      navigate('/dashboard');
    },
    onError: (err) => {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' });
    },
  });

  const onSubmit = (input: LoginInput) => login({ variables: { input } });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-white">
            <ChefHat className="h-10 w-10 text-orange-400" />
            <span className="text-3xl font-bold">FranchisePro</span>
          </div>
          <p className="text-gray-400 mt-2">Restaurant Franchise Management</p>
        </div>

        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Sign in to your account</CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@franchise.com"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  {...register('email')}
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              {/* Demo credentials */}
              <div className="bg-gray-700/50 rounded-md p-3 text-xs text-gray-400 space-y-1">
                <p className="font-medium text-gray-300">Demo Credentials:</p>
                <p>Admin: admin@franchise.com / Admin@123</p>
                <p>Manager: manager@franchise.com / Manager@123</p>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" loading={loading || isSubmitting}>
                Sign In
              </Button>
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium">Register</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
