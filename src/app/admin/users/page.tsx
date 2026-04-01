'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, Mail, Check, AlertTriangle } from 'lucide-react';

interface UserEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Customer {
  mallId: string;
  name: string;
  city: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('koy-ideapark-ab');
  const [role, setRole] = useState<'USER' | 'MANAGER' | 'ADMIN'>('USER');

  // Fetch existing users
  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch customers for dropdown
  useEffect(() => {
    fetch('/api/admin/malls')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, customerId, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ ok: true, message: `Welcome email sent to ${email}` });
        setEmail('');
        setName('');
        // Refresh user list
        const listRes = await fetch('/api/admin/users');
        const listData = await listRes.json();
        if (Array.isArray(listData)) setUsers(listData);
      } else {
        setResult({ ok: false, message: data.error || 'Failed to create user' });
      }
    } catch {
      setResult({ ok: false, message: 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">User Management</h1>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-xl border border-bo-neutral-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-bo-neutral-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New User
        </h2>

        {result && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-4 ${
            result.ok
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {result.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="user@company.fi"
                className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Matti Meikäläinen"
                className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Customer</label>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500"
              >
                <option value="koy-ideapark-ab">Koy Ideapark Ab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bo-neutral-700 mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'USER' | 'MANAGER' | 'ADMIN')}
                className="w-full px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg bg-bo-neutral-50 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/20 focus:border-bo-primary-500"
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-800 transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {submitting ? 'Creating...' : 'Create User & Send Welcome Email'}
          </button>
        </form>
      </div>

      {/* Existing Users */}
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
                  <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">Name</th>
                  <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">Role</th>
                  <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-bo-neutral-100 hover:bg-bo-neutral-50">
                    <td className="px-4 py-2 font-medium text-bo-neutral-900">{user.name}</td>
                    <td className="px-4 py-2 text-bo-neutral-600">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-bo-neutral-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}