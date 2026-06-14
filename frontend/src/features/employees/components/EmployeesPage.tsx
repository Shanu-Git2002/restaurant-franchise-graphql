import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/useToast';
import type { Employee } from '@/types';

const EMPLOYEES_QUERY = gql`
  query Employees($filter: EmployeeFilterInput, $sort: SortInput, $pagination: PaginationInput) {
    employees(filter: $filter, sort: $sort, pagination: $pagination) {
      data {
        id position hiredAt permissions
        user { id firstName lastName email role avatarUrl }
        outlet { id name city }
      }
      total page limit hasNextPage hasPreviousPage
    }
  }
`;

const DELETE_EMPLOYEE_MUTATION = gql`
  mutation DeleteEmployee($id: ID!) { deleteEmployee(id: $id) { success message } }
`;

const roleColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  SUPER_ADMIN: 'default',
  ADMIN: 'info',
  MANAGER: 'success',
  EMPLOYEE: 'secondary',
};

export function EmployeesPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, loading, refetch } = useQuery(EMPLOYEES_QUERY, {
    variables: {
      filter: search ? { search } : undefined,
      pagination: { page, limit: 10 },
      sort: { field: 'createdAt', direction: 'desc' },
    },
  });

  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE_MUTATION, {
    onCompleted: () => { toast({ title: 'Employee removed' }); refetch(); },
    onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const employees: Employee[] = data?.employees?.data ?? [];
  const pagination = data?.employees;

  const canManage = user && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role);

  const columns = [
    {
      key: 'user',
      header: 'Employee',
      render: (emp: Employee) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
            {getInitials(`${emp.user.firstName} ${emp.user.lastName}`)}
          </div>
          <div>
            <p className="font-medium text-sm">{emp.user.firstName} {emp.user.lastName}</p>
            <p className="text-xs text-muted-foreground">{emp.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (emp: Employee) => <Badge variant={roleColors[emp.user.role] ?? 'secondary'}>{emp.user.role}</Badge>,
    },
    {
      key: 'position',
      header: 'Position',
      render: (emp: Employee) => <span className="text-sm">{emp.position}</span>,
    },
    {
      key: 'outlet',
      header: 'Outlet',
      render: (emp: Employee) => (
        <span className="text-sm">{emp.outlet.name}<br />
          <span className="text-xs text-muted-foreground">{emp.outlet.city}</span>
        </span>
      ),
    },
    {
      key: 'hiredAt',
      header: 'Hired',
      render: (emp: Employee) => <span className="text-sm text-muted-foreground">{formatDate(emp.hiredAt)}</span>,
    },
    ...(canManage ? [{
      key: 'actions',
      header: '',
      render: (emp: Employee) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            onClick={() => {
              if (confirm('Remove this employee?')) deleteEmployee({ variables: { id: emp.id } });
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage team members across all outlets</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        total={pagination?.total}
        page={pagination?.page}
        limit={pagination?.limit}
        hasNextPage={pagination?.hasNextPage}
        hasPreviousPage={pagination?.hasPreviousPage}
        onPageChange={setPage}
        emptyMessage="No employees found"
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">Employee creation form goes here.</p>
          <Button onClick={() => setShowForm(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
