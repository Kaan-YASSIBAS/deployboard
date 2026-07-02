import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Globe2,
  Loader2,
  Plus,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  createMonitor,
  listIncidents,
  listMonitorChecks,
  listMonitors,
  runMonitorCheck,
} from "./api/monitors";

function statusBadge(status) {
  if (status === "UP") {
    return "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30";
  }

  if (status === "DOWN") {
    return "bg-red-500/10 text-red-300 ring-1 ring-red-500/30";
  }

  if (status === "DEGRADED") {
    return "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30";
  }

  return "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/30";
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/30">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
          <Icon size={20} />
        </div>
        <span className="text-xs text-slate-500">{helper}</span>
      </div>
      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function AddMonitorForm({ onCreate, isCreating }) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    expected_status: 200,
    check_interval_seconds: 300,
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await onCreate({
      name: form.name,
      url: form.url,
      expected_status: Number(form.expected_status),
      check_interval_seconds: Number(form.check_interval_seconds),
    });

    setForm({
      name: "",
      url: "",
      expected_status: 200,
      check_interval_seconds: 300,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Add monitor</h3>
          <p className="text-sm text-slate-500">Track a website or API endpoint.</p>
        </div>
        <div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
          <Plus size={20} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Name
          </label>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
            minLength={2}
            placeholder="DeployBoard API"
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 placeholder:text-slate-600 focus:ring-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            URL
          </label>
          <input
            value={form.url}
            onChange={(event) => updateField("url", event.target.value)}
            required
            type="url"
            placeholder="http://127.0.0.1:8000/health"
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 placeholder:text-slate-600 focus:ring-2"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Expected
          </label>
          <input
            value={form.expected_status}
            onChange={(event) => updateField("expected_status", event.target.value)}
            required
            type="number"
            min={100}
            max={599}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 focus:ring-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isCreating}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-950/40 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
        Create monitor
      </button>
    </form>
  );
}

export default function App() {
  const [monitors, setMonitors] = useState([]);
  const [checksByMonitor, setChecksByMonitor] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [checkingMonitorId, setCheckingMonitorId] = useState(null);
  const [error, setError] = useState(null);

  async function loadDashboard() {
    try {
      setError(null);
      const monitorList = await listMonitors();
      setMonitors(monitorList);

      const checkEntries = await Promise.all(
        monitorList.map(async (monitor) => {
          const checks = await listMonitorChecks(monitor.id);
          return [monitor.id, checks];
        })
      );

      setChecksByMonitor(Object.fromEntries(checkEntries));

      const incidentList = await listIncidents();
      setIncidents(incidentList);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCreateMonitor(payload) {
    try {
      setIsCreating(true);
      setError(null);
      await createMonitor(payload);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRunCheck(monitorId) {
    try {
      setCheckingMonitorId(monitorId);
      setError(null);
      await runMonitorCheck(monitorId);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingMonitorId(null);
    }
  }

  const stats = useMemo(() => {
    const total = monitors.length;
    const up = monitors.filter((monitor) => monitor.status === "UP").length;
    const down = monitors.filter((monitor) => monitor.status === "DOWN").length;

    const allChecks = Object.values(checksByMonitor).flat();
    const responseTimes = allChecks
      .map((check) => check.response_time_ms)
      .filter((value) => typeof value === "number");

    const avgResponse =
      responseTimes.length === 0
        ? "-"
        : `${Math.round(
            responseTimes.reduce((totalMs, value) => totalMs + value, 0) /
              responseTimes.length
          )}ms`;

    return { total, up, down, avgResponse };
  }, [monitors, checksByMonitor]);

  const chartData = useMemo(() => {
    const firstMonitor = monitors[0];

    if (!firstMonitor) {
      return [];
    }

    const checks = checksByMonitor[firstMonitor.id] || [];

    return checks
      .slice()
      .reverse()
      .map((check) => ({
        time: new Date(check.checked_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        response: check.response_time_ms || 0,
      }));
  }, [monitors, checksByMonitor]);

  const recentIncidents = useMemo(() => {
    return incidents.slice(0, 3);
  }, [incidents]);

  return (
    <div className="min-h-screen text-slate-100">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-800 bg-slate-950/80 p-6 backdrop-blur lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-500 p-2 text-white">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold">DeployBoard</h1>
            <p className="text-xs text-slate-500">Uptime monitoring</p>
          </div>
        </div>

        <nav className="mt-10 space-y-2 text-sm">
          <a className="flex items-center gap-3 rounded-xl bg-sky-500/10 px-3 py-2 text-sky-300" href="#">
            <Server size={18} />
            Dashboard
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100" href="#">
            <Globe2 size={18} />
            Monitors
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100" href="#">
            <AlertTriangle size={18} />
            Incidents
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100" href="#">
            <Clock3 size={18} />
            Status Pages
          </a>
        </nav>
      </aside>

      <main className="lg:ml-64">
        <header className="border-b border-slate-800 bg-slate-950/50 px-6 py-5 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Cloud-native monitoring dashboard</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Dashboard</h2>
            </div>

            <button
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <AddMonitorForm onCreate={handleCreateMonitor} isCreating={isCreating} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Globe2} label="Total monitors" value={stats.total} helper="active" />
            <StatCard icon={CheckCircle2} label="Services up" value={stats.up} helper="healthy" />
            <StatCard icon={AlertTriangle} label="Services down" value={stats.down} helper="needs attention" />
            <StatCard icon={Activity} label="Avg response" value={stats.avgResponse} helper="last checks" />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Response time</h3>
                  <p className="text-sm text-slate-500">
                    Latest checks for the first monitor
                  </p>
                </div>
              </div>

              <div className="mt-6 h-72">
                {chartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                    Run a check to see response time data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #1e293b",
                          borderRadius: "12px",
                          color: "#e5e7eb",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="response"
                        stroke="currentColor"
                        fill="currentColor"
                        fillOpacity={0.12}
                        className="text-sky-400"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
              <h3 className="font-semibold text-white">Recent incidents</h3>
              <p className="mt-1 text-sm text-slate-500">Latest monitor incidents</p>

              <div className="mt-6 space-y-4">
                {recentIncidents.length === 0 ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm font-medium text-emerald-200">
                      No recent incidents
                    </p>
                    <p className="mt-1 text-xs text-emerald-200/70">
                      Failed checks will appear here.
                    </p>
                  </div>
                ) : (
                  recentIncidents.map((incident) => {
                    const isActive = incident.status === "ACTIVE";

                    return (
                      <div
                        key={incident.id}
                        className={`rounded-xl border p-4 ${
                          isActive
                            ? "border-red-500/20 bg-red-500/10"
                            : "border-emerald-500/20 bg-emerald-500/10"
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            isActive ? "text-red-200" : "text-emerald-200"
                          }`}
                        >
                          {incident.monitor_name} · {incident.status}
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            isActive ? "text-red-200/70" : "text-emerald-200/70"
                          }`}
                        >
                          {incident.last_error || `HTTP ${incident.last_status_code ?? "ERR"}`} ·{" "}
                          Started {new Date(incident.started_at).toLocaleTimeString()}
                        </p>
                        {incident.resolved_at && (
                          <p className="mt-1 text-xs text-emerald-200/70">
                            Resolved {new Date(incident.resolved_at).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl shadow-slate-950/30">
            <div className="border-b border-slate-800 px-6 py-5">
              <h3 className="font-semibold text-white">Monitors</h3>
              <p className="text-sm text-slate-500">Services currently tracked by DeployBoard</p>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center gap-2 px-6 py-8 text-sm text-slate-400">
                  <Loader2 className="animate-spin" size={18} />
                  Loading monitors...
                </div>
              ) : monitors.length === 0 ? (
                <div className="px-6 py-8 text-sm text-slate-500">
                  No monitors yet. Add your first monitor above.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Expected</th>
                      <th className="px-6 py-4">Interval</th>
                      <th className="px-6 py-4">Latest response</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {monitors.map((monitor) => {
                      const latestCheck = checksByMonitor[monitor.id]?.[0];

                      return (
                        <tr key={monitor.id} className="hover:bg-slate-900/40">
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">{monitor.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{monitor.url}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(monitor.status)}`}>
                              {monitor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {monitor.expected_status}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {monitor.check_interval_seconds}s
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {latestCheck
                              ? `${latestCheck.response_time_ms ?? "-"}ms / ${
                                  latestCheck.status_code ?? "ERR"
                                }`
                              : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleRunCheck(monitor.id)}
                              disabled={checkingMonitorId === monitor.id}
                              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {checkingMonitorId === monitor.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                              Check
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}