import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ChefHat } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { REGISTER_MUTATION } from '../api/auth.graphql';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/useToast';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const [registerUser, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, refreshToken, user } = data.register;
      setAuth(user, accessToken, refreshToken);
      toast({ title: 'Account created!', description: 'Welcome to FranchisePro!', variant: 'default' });
      navigate('/dashboard');
    },
    onError: (err) => {
      toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
    },
  });

  const onSubmit = ({ confirmPassword, ...input }: RegisterInput) =>
    registerUser({ variables: { input } });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-white">
            <ChefHat className="h-10 w-10 text-orange-400" />
            <span className="text-3xl font-bold">FranchisePro</span>
          </div>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Register</CardTitle>
            <CardDescription className="text-gray-400">Fill in your details to get started</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">First Name</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white" placeholder="John" {...register('firstName')} />
                  {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Last Name</Label>
                  <Input className="bg-gray-700 border-gray-600 text-white" placeholder="Doe" {...register('lastName')} />
                  {errors.lastName && <p className="text-red-400 text-xs">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input type="email" className="bg-gray-700 border-gray-600 text-white" placeholder="john@example.com" {...register('email')} />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Phone (optional)</Label>
                <Input className="bg-gray-700 border-gray-600 text-white" placeholder="+91 98765 43210" {...register('phone')} />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <Input type="password" className="bg-gray-700 border-gray-600 text-white" {...register('password')} />
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Confirm Password</Label>
                <Input type="password" className="bg-gray-700 border-gray-600 text-white" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" loading={loading}>
                Create Account
              </Button>
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
