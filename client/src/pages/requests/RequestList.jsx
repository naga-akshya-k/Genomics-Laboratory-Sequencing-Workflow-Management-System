import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import requestsApi from '../../api/requestsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Select from '../../components/Select';

const RequestList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await requestsApi.getRequests({
        page,
        limit: 10,
        search,
        status,
        priority,
      });
      if (res?.data) {
        setRequests(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load requisitions', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset to page 1 on filter
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const columns = [
    {
      key: 'requestCode',
      label: 'Request Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          {val}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Requisition Title',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{val}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{row.purpose || 'No purpose recorded'}</p>
        </div>
      ),
    },
    {
      key: 'requester',
      label: 'Investigator',
      render: (val) => (
        <div>
          <p className="font-medium text-slate-800 text-xs">{val?.name || 'N/A'}</p>
          <p className="text-[11px] text-slate-500">{val?.organization || ''}</p>
        </div>
      ),
    },
    {
      key: 'sampleType',
      label: 'Sample Type',
      sortable: true,
      render: (val) => <span className="text-xs font-medium text-slate-700">{val}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'status',
      label: 'Lifecycle Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/requests/${row._id}`);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'requester' ? 'My Sequencing Requisitions' : 'All Sequencing Requisitions'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical test orders, exome profiling requests, and diagnostic workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchRequests} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/requests/new')} icon={Plus}>
            New Requisition
          </Button>
        </div>
      </div>

      {/* Filter Row Slot */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-48">
          <Select
            placeholder="All Statuses"
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            options={[
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            placeholder="All Priorities"
            value={priority}
            onChange={(e) => updateParam('priority', e.target.value)}
            options={[
              { value: 'routine', label: 'Routine' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        {(status || priority || search) && (
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

      {/* Requisitions DataTable */}
      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchPlaceholder="Search by REQ code, title, or purpose..."
        searchValue={search}
        onSearchChange={(val) => updateParam('search', val)}
        pagination={{
          page,
          pages,
          total,
          onPageChange: handlePageChange,
        }}
        onRowClick={(row) => navigate(`/requests/${row._id}`)}
        emptyMessage="No sequencing requisitions matched your query."
      />
    </div>
  );
};

export default RequestList;
