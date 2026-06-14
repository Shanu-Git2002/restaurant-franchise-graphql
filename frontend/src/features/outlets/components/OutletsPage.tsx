import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, Search, Store, MapPin, Pencil, Trash2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OUTLETS_QUERY, DELETE_OUTLET_MUTATION } from '../api/outlet.graphql';
import { OutletForm } from './OutletForm';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/useToast';
import type { Outlet } from '@/types';

const statusColors = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  SUSPENDED: 'destructive',
} as const;

export function OutletsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  const { data, loading, refetch } = useQuery(OUTLETS_QUERY, {
    variables: {
      filter: search ? { search } : undefined,
      pagination: { page, limit: 9 },
      sort: { field: 'createdAt', direction: 'desc' },
    },
  });

  const [deleteOutlet, { loading: deleting }] = useMutation(DELETE_OUTLET_MUTATION, {
    onCompleted: () => {
      toast({ title: 'Outlet deleted', variant: 'default' });
      refetch();
    },
    onError: (err) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  });

  const outlets: Outlet[] = data?.outlets?.data ?? [];
  const pagination = data?.outlets;

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      deleteOutlet({ variables: { id } });
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outlets</h1>
          <p className="text-muted-foreground">Manage all franchise locations</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditingOutlet(null); setShowForm(true); }} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Outlet
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search outlets..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : outlets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No outlets found</p>
          <p className="text-sm">Add your first outlet to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <Card key={outlet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base">{outlet.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-3 w-3" />
                      {outlet.city}, {outlet.state}
                    </div>
                  </div>
                  <Badge variant={statusColors[outlet.status]}>{outlet.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Rating</p>
                    <p className="font-medium">⭐ {outlet.averageRating?.toFixed(1) ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Reviews</p>
                    <p className="font-medium">{outlet.totalReviews}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Employees</p>
                    <p className="font-medium">{outlet.employeeCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Revenue</p>
                    <p className="font-medium">{outlet.totalRevenue ? formatCurrency(outlet.totalRevenue) : 'N/A'}</p>
                  </div>
                </div>

                {outlet.manager && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
                    <UserCheck className="h-4 w-4" />
                    <span>{outlet.manager.firstName} {outlet.manager.lastName}</span>
                  </div>
                )}

                {canManage && (
                  <div className="flex gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setEditingOutlet(outlet); setShowForm(true); }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:border-red-300"
                      onClick={() => handleDelete(outlet.id, outlet.name)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!pagination.hasPreviousPage} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}</DialogTitle>
          </DialogHeader>
          <OutletForm
            outlet={editingOutlet}
            onSuccess={() => { setShowForm(false); refetch(); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
