import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getUsersApi, updateUserRoleApi, deactivateUserApi } from '../api/userApi';
import Modal  from '../components/common/Modal';
import Badge  from '../components/common/Badge';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const ROLES = ['ADMIN', 'CASHIER'];
const ROLE_COLORS = { ADMIN: 'danger', CASHIER: 'info' };

const Users = () => {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [roleModal,  setRoleModal]  = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [newRole,    setNewRole]    = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await getUsersApi(); setUsers(res.data.data || []); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const openRoleModal = (user) => {
    setSelected(user); setNewRole(user.role); setRoleModal(true);
  };

  const handleUpdateRole = async () => {
    setSaving(true);
    try {
      await updateUserRoleApi(selected.id, newRole);
      toast.success('Role updated!');
      setRoleModal(false); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      await deactivateUserApi(selected.id);
      toast.success('User deactivated');
      setDeleteModal(false); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-400 mt-0.5">{users.length} users registered</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['#', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                <th key={i} className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No users found</td></tr>
            ) : users.map((user, idx) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3"><Badge label={user.role} type={ROLE_COLORS[user.role] || 'gray'} /></td>
                <td className="px-4 py-3">
                  <Badge label={user.active ? 'Active' : 'Inactive'} type={user.active ? 'success' : 'gray'} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3">
                  {user.active && (
                    <div className="flex gap-1.5">
                      <button onClick={() => openRoleModal(user)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                        🔑 Role
                      </button>
                      <button onClick={() => { setSelected(user); setDeleteModal(true); }}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                        🚫 Deactivate
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Modal */}
      <Modal isOpen={roleModal} onClose={() => setRoleModal(false)} title="Change User Role" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setRoleModal(false)}>Cancel</Button><Button loading={saving} onClick={handleUpdateRole}>Update Role</Button></>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="font-semibold text-gray-900">{selected?.name}</div>
            <div className="text-gray-500 text-xs">{selected?.email}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">New Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Deactivate User" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDeactivate}>Deactivate</Button></>}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto">🚫</div>
          <p className="font-semibold text-gray-900">Deactivate {selected?.name}?</p>
          <p className="text-sm text-gray-400">They won't be able to log in anymore.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Users;