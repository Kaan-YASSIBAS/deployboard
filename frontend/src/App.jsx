import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Globe2,
  Plus,
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

const monitors = [
  {
    name: "DeployBoard API",
    url: "http://127.0.0.1:8000/health",
    status: "UP",
    uptime: "99.9%",
    responseTime: "46ms",
    lastCheck: "1 min ago",
  },
  {
    name: "Portfolio Website",
    url: "https://example.com",
    status: "UP",
    uptime: "99.7%",
    responseTime: "123ms",
    lastCheck: "2 min ago",
  },
  {
    name: "Test Backend",
    url: "https://api.example.com",
    status: "DOWN",
    uptime: "91.2%",
    responseTime: "-",
    lastCheck: "4 min ago",
  },
];

const chartData = [
  { time: "12:00", response: 120 },
  { time: "12:05", response: 160 },
  { time: "12:10", response: 95 },
  { time: "12:15", response: 210 },
  { time: "12:20", response: 140 },
  { time: "12:25", response: 46 },
];

function statusBadge(status) {
  if (status === "UP") {
    return "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30";
  }

  if (status === "DOWN") {
    return "bg-red-500/10 text-red-300 ring-1 ring-red-500/30";
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

export default function App() {
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

            <button className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-950/40 hover:bg-sky-400">
              <Plus size={18} />
              Add monitor
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Globe2} label="Total monitors" value="3" helper="active" />
            <StatCard icon={CheckCircle2} label="Services up" value="2" helper="healthy" />
            <StatCard icon={AlertTriangle} label="Services down" value="1" helper="needs attention" />
            <StatCard icon={Activity} label="Avg response" value="103ms" helper="last check" />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Response time</h3>
                  <p className="text-sm text-slate-500">Latest DeployBoard API checks</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                  Operational
                </span>
              </div>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="response" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                      fill="url(#response)"
                      className="text-sky-400"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
              <h3 className="font-semibold text-white">Recent incidents</h3>
              <p className="mt-1 text-sm text-slate-500">Latest events from your monitors</p>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-200">Test Backend is down</p>
                  <p className="mt-1 text-xs text-red-200/70">Connection timed out · 4 min ago</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-200">DeployBoard API recovered</p>
                  <p className="mt-1 text-xs text-emerald-200/70">HTTP 200 · 16 min ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl shadow-slate-950/30">
            <div className="border-b border-slate-800 px-6 py-5">
              <h3 className="font-semibold text-white">Monitors</h3>
              <p className="text-sm text-slate-500">Services currently tracked by DeployBoard</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Uptime</th>
                    <th className="px-6 py-4">Response</th>
                    <th className="px-6 py-4">Last check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {monitors.map((monitor) => (
                    <tr key={monitor.name} className="hover:bg-slate-900/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{monitor.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{monitor.url}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(monitor.status)}`}>
                          {monitor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{monitor.uptime}</td>
                      <td className="px-6 py-4 text-slate-300">{monitor.responseTime}</td>
                      <td className="px-6 py-4 text-slate-400">{monitor.lastCheck}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}