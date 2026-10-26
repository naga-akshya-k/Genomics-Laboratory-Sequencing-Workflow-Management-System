import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, User, Calendar, FileText } from 'lucide-react';
import interopApi from '../../api/interopApi';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';

const AuditTrail = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await interopApi.getAuditLogs({
        page: currentPage,
        limit: 15,
        entityType: selectedEntity,
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.totalPages);
      }
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedEntity, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs font-mono text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Operator / User',
      accessor: 'user',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-800">{row.user?.name || 'System'}</p>
          <p className="text-[10px] text-slate-400 capitalize">{row.user?.role?.replace('_', ' ') || 'Process'}</p>
        </div>
      ),
    },
    {
      header: 'Action Executed',
      accessor: 'action',
      render: (row) => (
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Target Entity',
      accessor: 'entityType',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-teal-800">{row.entityType}</span>
          {row.entityId && <span className="text-slate-400 block font-mono text-[10.5px]">{row.entityId}</span>}
        </div>
      ),
    },
    {
      header: 'Audit Trail Details',
      accessor: 'details',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-2 max-w-md">
          {row.details}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      render: (row) => (
        <span className="text-[11px] font-mono text-slate-400">
          {row.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            ISO-15189 &amp; 21 CFR Part 11 Regulatory Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable laboratory chain-of-custody logging all clinical state transitions, approvals, and report disbursements.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="self-start sm:self-auto flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh Audit Log
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Filter by Entity Type"
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'All Entities' },
              { value: 'Request', label: 'Requisitions' },
              { value: 'Sample', label: 'Specimens' },
              { value: 'QCRecord', label: 'Quality Control' },
              { value: 'SequencingRun', label: 'Flowcell Runs' },
              { value: 'Report', label: 'Clinical Reports' },
              { value: 'System', label: 'System Lifecycle' },
            ]}
          />
          <div className="sm:col-span-2 flex items-end">
            <p className="text-xs text-slate-500 pb-2">
              Showing <span className="font-bold text-slate-800">{total}</span> authenticated transactions recorded in compliance with CAP/CLIA accreditation guidelines.
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          total={total}
          page={currentPage}
          pages={pages}
          onPageChange={setCurrentPage}
          emptyMessage="No audit logs recorded for this criteria."
        />
      </Card>
    </div>
  );
};

export default AuditTrail;
