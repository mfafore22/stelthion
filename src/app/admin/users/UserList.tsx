'use client';

import { Users } from 'lucide-react';

export interface UserEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  customer?: { name: string };
}

interface Props {
  users: UserEntry[];
  loading: boolean;
  showCustomer: boolean;
}

export function UserList({ users, loading, showCustomer }: Props) {
  return (
    <div className="bg-white rounded-xl border border-bo-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-bo-neutral-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Existing Users
      </h2>
      {loading ? (
        <p className="text-sm text-bo-neutral-400">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-bo-neutral-400">No users found</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-bo-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-bo-neutral-50">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                {showCustomer && <Th>Customer</Th>}
                <Th>Role</Th>
                <Th align="right">Created</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-bo-neutral-100 hover:bg-bo-neutral-50">
                  <td className="px-4 py-2 font-medium text-bo-neutral-900">{u.name}</td>
                  <td className="px-4 py-2 text-bo-neutral-600">{u.email}</td>
                  {showCustomer && (
                    <td className="px-4 py-2 text-bo-neutral-600">{u.customer?.name ?? '–'}</td>
                  )}
                  <td className="px-4 py-2">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-2 text-right text-bo-neutral-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`text-${align} px-4 py-2 font-medium text-bo-neutral-600`}>{children}</th>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'ADMIN'
      ? 'bg-purple-100 text-purple-700'
      : role === 'MANAGER'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-green-100 text-green-700';
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{role}</span>;
}
