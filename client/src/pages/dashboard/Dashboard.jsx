import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FileSpreadsheet,
  TestTubes,
  Cpu,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Download,
  AlertCircle,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import dashboardApi from '../../api/dashboardApi';
import reportsApi from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StageTimeline from '../../components/StageTimeline';

const STAGE_COLORS = {
  registered: '#94a3b8',
  qc: '#f59e0b',
  sequencing: '#06b6d4',
  analysis: '#6366f1',
  report_ready: '#a855f7',
  delivered: '#10b981',
};

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getSummary();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownloadPdf = async (reportId, reportCode) => {
    try {
      showToast(`Downloading clinical report ${reportCode}...`, 'info');
      await reportsApi.downloadReport(reportId, reportCode);
      showToast('Download complete', 'success');
    } catch (err) {
      showToast('Error downloading report PDF', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-xl border border-slate-200" />
          <div className="h-72 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  // ==========================================
  // 1. ADMIN DASHBOARD VIEW
  // ==========================================
  if (user?.role === 'admin') {
    const stageChartData = data?.samplesByStage
      ? Object.entries(data.samplesByStage).map(([stage, count]) => ({
          name: stage.replace('_', ' ').toUpperCase(),
          stageKey: stage,
          value: count,
        }))
      : [];

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Laboratory Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time throughput metrics, system capacity, and operational workflow oversight
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchDashboardData} icon={Activity}>
              Refresh Data
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/admin/users')} icon={Users}>
              Manage Personnel
            </Button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Personnel"
            value={`${data?.activeUsers || 0} / ${data?.totalUsers || 0}`}
            subtitle="Registered lab staff & clinicians"
            icon={Users}
            color="indigo"
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            title="Total Requisitions"
            value={data?.totalRequests || 0}
            subtitle={`${data?.requestsByStatus?.in_progress || 0} active in pipeline`}
            icon={FileSpreadsheet}
            color="teal"
            onClick={() => navigate('/requests')}
          />
          <StatCard
            title="Specimens Tracked"
            value={data?.totalSamples || 0}
            subtitle={`${data?.samplesByStage?.sequencing || 0} currently on flowcell`}
            icon={TestTubes}
            color="emerald"
            onClick={() => navigate('/samples')}
          />
          <StatCard
            title="Active Sequencing Runs"
            value={data?.activeSequencingRuns || 0}
            subtitle="NovaSeq & MiSeq clusters running"
            icon={Cpu}
            color="amber"
            onClick={() => navigate('/sequencing')}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Request Volume (Recharts BarChart) */}
          <Card
            title="Requisition Volume (Past 6 Months)"
            subtitle="Monthly intake trend across clinical trials"
            className="lg:col-span-2"
          >
            <div className="h-64 w-full">
              {data?.monthlyChart && data.monthlyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val} Requisitions`, 'Intake']}
                    />
                    <Bar dataKey="requests" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No monthly activity recorded yet.
                </div>
              )}
            </div>
          </Card>

          {/* Specimen Lifecycle Distribution (PieChart) */}
          <Card title="Specimens by Pipeline Stage" subtitle="Distribution across analytical checkpoints">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stageKey] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-[11px] text-slate-600 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Requisitions Table */}
        <Card
          title="Recent Clinical Requisitions"
          subtitle="Latest research requisitions logged in system"
          action={
            <Link to="/requests" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View All Requests <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">
                <tr>
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Investigator</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentRequests?.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-mono text-xs font-semibold text-teal-700">
                      <Link to={`/requests/${req._id}`}>{req.requestCode}</Link>
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">{req.title}</td>
                    <td className="py-2.5 text-xs text-slate-600">{req.requester?.name || 'N/A'}</td>
                    <td className="py-2.5 text-xs text-slate-600">{req.sampleType}</td>
                    <td className="py-2.5">
                      <StatusBadge status={req.priority} />
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 2. LAB STAFF DASHBOARD VIEW (ACTION QUEUE)
  // ==========================================
  if (user?.role === 'lab_staff') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Operations Queue</h1>
            <p className="text-xs text-slate-500 mt-1">
              Actionable worklist for sample intake, QC verification, flowcell sequencing, and report release
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/samples/register')} icon={Plus}>
              Register Specimen
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/qc')} icon={Activity}>
              Record QC
            </Button>
          </div>
        </div>

        {/* Operational Queue Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Requisitions to Review"
            value={data?.pendingReviews || 0}
            subtitle="Awaiting lab director approval"
            icon={Clock}
            color="amber"
            onClick={() => navigate('/requests?status=submitted')}
          />
          <StatCard
            title="Specimens Awaiting QC"
            value={data?.samplesAwaitingQC || 0}
            subtitle="Registered and queued for Qubit/TapeStation"
            icon={Activity}
            color="teal"
            onClick={() => navigate('/samples?currentStage=registered')}
          />
          <StatCard
            title="Active Sequencing Runs"
            value={data?.activeSequencingRuns || 0}
            subtitle="NovaSeq & MiSeq active flowcells"
            icon={Cpu}
            color="indigo"
            onClick={() => navigate('/sequencing')}
          />
          <StatCard
            title="Reports Ready for Release"
            value={data?.samplesReportReady || 0}
            subtitle="Bioinformatics complete; await delivery"
            icon={FileText}
            color="emerald"
            onClick={() => navigate('/reports?status=draft')}
          />
        </div>

        {/* Action Queues Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Queue 1: Requisitions Awaiting Approval */}
          <Card
            title="Requisitions Awaiting Action"
            subtitle="Click requisition to review protocol and approve/reject"
            action={
              <Link to="/requests" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                All Requisitions <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <div className="space-y-3">
              {data?.queues?.requestsToReview?.length > 0 ? (
                data.queues.requestsToReview.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => navigate(`/requests/${req._id}`)}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-teal-400 bg-white hover:bg-teal-50/20 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700">{req.requestCode}</span>
                        <StatusBadge status={req.priority} />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 line-clamp-1">{req.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Requester: {req.requester?.name || 'Investigator'} ({req.requester?.organization || 'Clinical'})
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/requests/${req._id}`)}>
                      Review
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No pending requisitions to review right now.</p>
              )}
            </div>
          </Card>

          {/* Action Queue 2: Specimens Needing QC / Analysis */}
          <Card
            title="Specimens in Processing Pipeline"
            subtitle="Specimens registered and moving through workflow stages"
            action={
              <Link to="/samples" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                All Specimens <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <div className="space-y-3">
              {data?.queues?.samplesQueue?.length > 0 ? (
                data.queues.samplesQueue.map((smp) => (
                  <div
                    key={smp._id}
                    onClick={() => navigate(`/samples/${smp._id}`)}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-teal-400 bg-white hover:bg-teal-50/20 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{smp.sampleCode}</span>
                        <span className="text-[11px] text-slate-500">({smp.sampleType})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Requisition: {smp.request?.requestCode || 'Linked'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={smp.currentStage} />
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No active specimens queued.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. REQUESTER DASHBOARD VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Requester Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investigator Research Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status of your genomic sequencing requisitions, specimen processing, and clinical reports
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/requests/new')} icon={Plus}>
          Submit New Requisition
        </Button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Active Requisitions"
          value={data?.activeRequestsCount || 0}
          subtitle={`${data?.totalRequests || 0} lifetime requisitions`}
          icon={FileSpreadsheet}
          color="teal"
          onClick={() => navigate('/requests')}
        />
        <StatCard
          title="Specimens In Processing"
          value={data?.samplesInProgressCount || 0}
          subtitle={`${data?.totalSamples || 0} total specimens registered`}
          icon={TestTubes}
          color="indigo"
          onClick={() => navigate('/samples')}
        />
        <StatCard
          title="Available Reports"
          value={data?.availableReportsCount || 0}
          subtitle="Delivered clinical genomics PDFs"
          icon={FileText}
          color="emerald"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Requester Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Requisitions */}
        <Card
          title="My Recent Requisitions"
          subtitle="Status of recently submitted sequencing requests"
          action={
            <Link to="/requests" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {data?.recentRequests?.length > 0 ? (
              data.recentRequests.map((req) => (
                <div
                  key={req._id}
                  onClick={() => navigate(`/requests/${req._id}`)}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-teal-400 bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700">{req.requestCode}</span>
                      <StatusBadge status={req.priority} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1 line-clamp-1">{req.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Intake: {new Date(req.createdAt).toLocaleDateString()} • {req.sampleType}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">You haven't submitted any requisitions yet.</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/requests/new')}>
                  Submit Your First Requisition
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Delivered Reports Available for Download */}
        <Card
          title="Delivered Clinical Reports"
          subtitle="Finalized clinical reports ready for download"
          action={
            <Link to="/reports" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {data?.availableReports?.length > 0 ? (
              data.availableReports.map((rep) => (
                <div
                  key={rep._id}
                  className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800">{rep.reportCode}</span>
                      <StatusBadge status={rep.status} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1">
                      Specimen: <span className="font-mono font-semibold">{rep.sample?.sampleCode}</span> ({rep.sample?.sampleType})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Requisition: {rep.request?.requestCode}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownloadPdf(rep._id, rep.reportCode)}
                  >
                    PDF
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                No finalized reports delivered yet. Once sequencing analysis is complete, your reports will appear here.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* In-Progress Specimen Stage Tracking */}
      {data?.activeSamples?.length > 0 && (
        <Card
          title="Active Specimen Tracking"
          subtitle="Real-time pipeline progression for your ongoing specimens"
        >
          <div className="space-y-4">
            {data.activeSamples.map((sample) => (
              <div key={sample._id} className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-900">{sample.sampleCode}</span>
                    <span className="text-xs text-slate-500 ml-2">({sample.sampleType})</span>
                    <p className="text-xs text-slate-500 mt-0.5">Requisition: {sample.request?.title}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/samples/${sample._id}`)}
                  >
                    View Details
                  </Button>
                </div>
                <StageTimeline currentStage={sample.currentStage} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
