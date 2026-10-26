import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Users, RefreshCw, UserCheck, UserX, Edit3, Shield } from 'lucide-react';
import usersApi from '../../api/usersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'lab_staff',
    organization: '',
    phone: '',
  });
  const [creating, setCreating] = useState(false);

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'lab_staff',
    organization: '',
    phone: '',
    password: '',
  });
  const [editing, setEditing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersApi.getUsers({
        page,
        limit: 10,
        search,
        role,
      });
      if (res?.data) {
        setUsers(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load user directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      showToast('Please provide name, email, and initial password', 'error');
      return;
    }

    try {
      setCreating(true);
      await usersApi.createUser(createForm);
      showToast(`User ${createForm.name} provisioned successfully!`, 'success');
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'lab_staff',
        organization: '',
        phone: '',
      });
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      organization: u.organization || '',
      phone: u.phone || '',
      password: '',
    });
    setEditModalOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setEditing(true);
      await usersApi.updateUser(selectedUser._id, editForm);
      showToast(`User account updated successfully`, 'success');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setEditing(false);
    }
  };

  const handleToggleDeactivate = async (u) => {
    if (u._id === currentUser._id) {
      showToast('You cannot deactivate your own administrative account', 'error');
      return;
    }

    try {
      const res = await usersApi.toggleDeactivate(u._id);
      showToast(res.message, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to toggle account status', 'error');
    }
  };

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const columns = [
    {
      key: 'name',
      label: 'Staff / Investigator',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{val}</p>
          <p className="text-xs text-slate-500 mt-0.5">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Assigned Role',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'organization',
      label: 'Department / Organization',
      sortable: true,
      render: (val) => <span className="text-xs text-slate-700">{val || '—'}</span>,
    },
    {
      key: 'phone',
      label: 'Phone Contact',
      render: (val) => <span className="text-xs text-slate-500">{val || '—'}</span>,
    },
    {
      key: 'isActive',
      label: 'Account Status',
      sortable: true,
      render: (val) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            val
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {val ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Edit3} onClick={() => openEditModal(row)}>
            Edit
          </Button>

          <Button
            variant={row.isActive ? 'ghost' : 'success'}
            size="sm"
            onClick={() => handleToggleDeactivate(row)}
            disabled={row._id === currentUser._id}
            className={row.isActive ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' : ''}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System User Directory & RBAC</h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-Based Access Control administration, account provisioning, and access delegation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchUsers} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)} icon={Plus}>
            Provision New User
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-52">
          <Select
            placeholder="All System Roles"
            value={role}
            onChange={(e) => updateParam('role', e.target.value)}
            options={[
              { value: 'admin', label: 'Admin (Director)' },
              { value: 'lab_staff', label: 'Lab Staff (Sequencing Specialist)' },
              { value: 'requester', label: 'Requester (Investigator)' },
            ]}
          />
        </div>

        {(role || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search by name, email, or department..."
        searchValue={search}
        onSearchChange={(val) => updateParam('search', val)}
        pagination={{
          page,
          pages,
          total,
          onPageChange: (newPage) => {
            const newP = new URLSearchParams(searchParams);
            newP.set('page', String(newPage));
            setSearchParams(newP);
          },
        }}
        emptyMessage="No system users found."
      />

      {/* Provision User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New User Account"
        subtitle="Create credentials and assign security role"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={creating} onClick={handleCreateUser}>
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Dr. Eleanor Vance"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="analyst@genomicslab.org"
            required
          />

          <Input
            label="Temporary Initial Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Min. 6 chars"
            required
          />

          <Select
            label="Security Role (RBAC)"
            value={createForm.role}
            onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
            options={[
              { value: 'lab_staff', label: 'Lab Staff (Operates instruments, QC, analysis)' },
              { value: 'requester', label: 'Requester (Submits study requisitions)' },
              { value: 'admin', label: 'Administrator (Full permissions + user admin)' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department / Org"
              value={createForm.organization}
              onChange={(e) => setCreateForm((p) => ({ ...p, organization: e.target.value }))}
              placeholder="Clinical Genetics Core"
            />
            <Input
              label="Phone Contact"
              value={createForm.phone}
              onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1-555-0100"
            />
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User Details"
        subtitle={`Modify account attributes for ${selectedUser?.email}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={editing} onClick={handleEditUser}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            required
          />

          <Select
            label="Security Role (RBAC)"
            value={editForm.role}
            onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
            options={[
              { value: 'lab_staff', label: 'Lab Staff' },
              { value: 'requester', label: 'Requester' },
              { value: 'admin', label: 'Administrator' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department / Org"
              value={editForm.organization}
              onChange={(e) => setEditForm((p) => ({ ...p, organization: e.target.value }))}
            />
            <Input
              label="Phone Contact"
              value={editForm.phone}
              onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <Input
            label="Reset Password (leave empty to keep current)"
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="New password (optional)"
          />
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
