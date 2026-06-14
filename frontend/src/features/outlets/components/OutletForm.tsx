import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@apollo/client';
import { z } from 'zod';
import { CREATE_OUTLET_MUTATION, UPDATE_OUTLET_MUTATION, FRANCHISE_QUERY } from '../api/outlet.graphql';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
import type { Outlet } from '@/types';

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

interface OutletFormProps {
  outlet?: Outlet | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OutletForm({ outlet, onSuccess, onCancel }: OutletFormProps) {
  const isEditing = !!outlet;

  const { data: franchiseData } = useQuery(FRANCHISE_QUERY);
  const franchise = franchiseData?.franchise;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: outlet ? {
      name: outlet.name,
      address: outlet.address,
      city: outlet.city,
      state: outlet.state,
      country: outlet.country,
      postalCode: outlet.postalCode ?? '',
      phone: outlet.phone ?? '',
      email: outlet.email ?? '',
      managerId: outlet.manager?.id ?? '',
    } : {
      country: 'India',
    },
  });

  const [createOutlet, { loading: creating }] = useMutation(CREATE_OUTLET_MUTATION, {
    onCompleted: () => { toast({ title: 'Outlet created!' }); onSuccess(); },
    onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const [updateOutlet, { loading: updating }] = useMutation(UPDATE_OUTLET_MUTATION, {
    onCompleted: () => { toast({ title: 'Outlet updated!' }); onSuccess(); },
    onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateOutlet({ variables: { id: outlet.id, input: data } });
    } else {
      createOutlet({ variables: { input: { ...data, franchiseId: franchise?.id ?? '' } } });
    }
  };

  const loading = creating || updating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Outlet Name *</Label>
        <Input placeholder="e.g. Spice Garden - Bandra" {...register('name')} />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Address *</Label>
        <Input placeholder="Street address" {...register('address')} />
        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>City *</Label>
          <Input placeholder="Mumbai" {...register('city')} />
          {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>State *</Label>
          <Input placeholder="Maharashtra" {...register('state')} />
          {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...register('country')} />
        </div>
        <div className="space-y-2">
          <Label>Postal Code</Label>
          <Input placeholder="400001" {...register('postalCode')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input placeholder="+91 22 1234 5678" {...register('phone')} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" placeholder="outlet@franchise.com" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
          {isEditing ? 'Update Outlet' : 'Create Outlet'}
        </Button>
      </div>
    </form>
  );
}
