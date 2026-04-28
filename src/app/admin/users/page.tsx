'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { Users } from 'lucide-react';
import { AddUserForm } from './AddUserForm';
import { UserList, type UserEntry } from './UserList';

interface CustomerCtx {
  id: string;
  name: string;
  isStelthionAdmin: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminUsersPage() {
  const { data: ctx } = useSWR<CustomerCtx>('/api/admin/customer-context', fetcher);

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <Users className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">User Management</h1>
      </div>
      {ctx?.name && (
        <p className="text-sm text-bo-neutral-500 mb-6">Scope: {ctx.name}</p>
      )}

      <AddUserForm
        activeCustomer={ctx ? { id: ctx.id, name: ctx.name } : null}
        onCreated={fetchUsers}
      />

      <UserList users={users} loading={loading} showCustomer={false} />
    </div>
  );
}
