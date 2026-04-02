import { useEffect, useMemo, useState } from 'react';
import { getAdminUsers, updateAdminUserStatus } from '../../services/adminApi';
import type { AdminUserItem, AdminUsersResponse } from '../../types/admin';

const PAGE_SIZE = 8;

function displayName(user: AdminUserItem) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const totalPages = data?.totalPages ?? 0;

  const loadUsers = async (nextPage: number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getAdminUsers(nextPage, PAGE_SIZE);
      setData(response);
      setPage(response.page);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(0);
  }, []);

  const users = useMemo(() => data?.items ?? [], [data]);

  const handleStatusChange = async (user: AdminUserItem, field: 'enabled' | 'accountNonLocked', value: boolean) => {
    setUpdatingUserId(user.id);
    setError('');

    try {
      await updateAdminUserStatus(user.id, {
        enabled: field === 'enabled' ? value : user.enabled,
        accountNonLocked: field === 'accountNonLocked' ? value : user.accountNonLocked,
      });
      await loadUsers(page);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-900">User Management</h2>
        <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {data ? `${data.totalElements} users` : 'Loading users'}
        </span>
      </div>

      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Enabled</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Unlocked</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>Loading user records...</td>
                </tr>
              )}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>No users found.</td>
                </tr>
              )}

              {!isLoading && users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{displayName(user)}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.enabled ? 'true' : 'false'}
                      disabled={updatingUserId === user.id}
                      onChange={(event) => void handleStatusChange(user, 'enabled', event.target.value === 'true')}
                      className="rounded-lg border border-slate-300 px-2 py-1"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.accountNonLocked ? 'true' : 'false'}
                      disabled={updatingUserId === user.id}
                      onChange={(event) => void handleStatusChange(user, 'accountNonLocked', event.target.value === 'true')}
                      className="rounded-lg border border-slate-300 px-2 py-1"
                    >
                      <option value="true">Unlocked</option>
                      <option value="false">Locked</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="button"
            disabled={page <= 0 || isLoading}
            onClick={() => void loadUsers(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-600">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
          <button
            type="button"
            disabled={isLoading || totalPages === 0 || page + 1 >= totalPages}
            onClick={() => void loadUsers(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
