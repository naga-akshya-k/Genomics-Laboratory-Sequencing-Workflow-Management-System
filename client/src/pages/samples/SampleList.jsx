import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Eye, RefreshCw, TestTubes } from 'lucide-react';
import samplesApi from '../../api/samplesApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Select from '../../components/Select';

const SampleList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const currentStage = searchParams.get('currentStage') || '';

  const fetchSamples = useCallback(async () => {
    try {
      setLoading(true);
      const res = await samplesApi.getSamples({
        page,
        limit: 10,
        search,
        currentStage,
      });
      if (res?.data) {
        setSamples(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load specimens', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, currentStage, showToast]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

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

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const isStaffOrAdmin = ['admin', 'lab_staff'].includes(user?.role);

  const columns = [
    {
      key: 'sampleCode',
      label: 'Sample Barcode',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {val}
        </span>
      ),
    },
    {
      key: 'request',
      label: 'Linked Requisition',
      render: (val) => (
        <div>
          <span className="font-mono text-xs font-semibold text-teal-700">{val?.requestCode}</span>
          <p className="text-xs text-slate-800 font-medium line-clamp-1">{val?.title}</p>
        </div>
      ),
    },
    {
      key: 'sampleType',
      label: 'Type',
      sortable: true,
      render: (val) => <span className="text-xs font-medium text-slate-700">{val}</span>,
    },
    {
      key: 'currentStage',
      label: 'Current Stage',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'receivedDate',
      label: 'Received Date',
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {val ? new Date(val).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'registeredBy',
      label: 'Intake Staff',
      render: (val) => <span className="text-xs text-slate-600">{val?.name || 'Lab Staff'}</span>,
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
            navigate(`/samples/${row._id}`);
          }}
        >
          Track
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'requester' ? 'My Specimens' : 'Specimen Inventory & Tracking'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking barcodes, bio-banking metadata, and checkpoint progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchSamples} icon={RefreshCw}>
            Refresh
          </Button>
          {isStaffOrAdmin && (
            <Button variant="primary" size="md" onClick={() => navigate('/samples/register')} icon={Plus}>
              Register Specimen
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-56">
          <Select
            placeholder="All Workflow Stages"
            value={currentStage}
            onChange={(e) => updateParam('currentStage', e.target.value)}
            options={[
              { value: 'registered', label: '1. Registered (Intake)' },
              { value: 'qc', label: '2. QC Assessment' },
              { value: 'sequencing', label: '3. Sequencing (Flowcell)' },
              { value: 'analysis', label: '4. Bioinformatics' },
              { value: 'report_ready', label: '5. Report Ready' },
              { value: 'delivered', label: '6. Delivered' },
            ]}
          />
        </div>

        {(currentStage || search) && (
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

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={samples}
        loading={loading}
        searchPlaceholder="Search barcode or specimen type..."
        searchValue={search}
        onSearchChange={(val) => updateParam('search', val)}
        pagination={{
          page,
          pages,
          total,
          onPageChange: handlePageChange,
        }}
        onRowClick={(row) => navigate(`/samples/${row._id}`)}
        emptyMessage="No biological specimens found."
      />
    </div>
  );
};

export default SampleList;
