import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Globe2,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
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
  deleteMonitor,
  getCurrentUser,
  listIncidents,
  listMonitorChecks,
  listMonitors,
  loginUser,
  registerUser,
  runMonitorCheck,
  updateMonitor,
} from "./api/monitors";

const TOKEN_STORAGE_KEY = "deployboard_access_token";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Server },
  { id: "monitors", label: "Monitors", icon: Globe2 },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "status-pages", label: "Status Pages", icon: Clock3 },
];

const viewDetails = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Cloud-native monitoring overview",
  },
  monitors: {
    title: "Monitors",
    subtitle: "Create, edit, check, and delete monitored services",
  },
  incidents: {
    title: "Incidents",
    subtitle: "Track active and resolved monitor incidents",
  },
  "status-pages": {
    title: "Status Pages",
    subtitle: "Publish uptime and incident history for selected monitors.",
  },
};

const plannedStatusPageFeatures = [
  "Select monitors to publish",
  "Public shareable URL",
  "Uptime and response history",
  "Active and resolved incident timeline",
  "Custom status page title",
  "Optional branding",
];

const sampleStatusServices = ["API", "Frontend", "Database"];

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

      <div className="mt-5 grid gap-4 md:grid-cols-5">
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

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Interval seconds
          </label>
          <input
            value={form.check_interval_seconds}
            onChange={(event) =>
              updateField("check_interval_seconds", event.target.value)
            }
            required
            type="number"
            min={60}
            max={86400}
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

function MonitorTable({
  monitors,
  checksByMonitor,
  isLoading,
  checkingMonitorId,
  deletingMonitorId,
  onCheck,
  onEdit,
  onDelete,
  showCrudActions = false,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl shadow-slate-950/30">
      <div className="border-b border-slate-800 px-6 py-5">
        <h3 className="font-semibold text-white">Monitors</h3>
        <p className="text-sm text-slate-500">
          {showCrudActions
            ? "Services currently tracked by DeployBoard"
            : "Current service health and latest checks"}
        </p>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-slate-400">
            <Loader2 className="animate-spin" size={18} />
            Loading monitors...
          </div>
        ) : monitors.length === 0 ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            {showCrudActions
              ? "No monitors yet. Add your first monitor above."
              : "No monitors yet. Create your first monitor from the Monitors page."}
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                          monitor.status
                        )}`}
                      >
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onCheck(monitor.id)}
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

                        {showCrudActions && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(monitor)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(monitor)}
                              disabled={deletingMonitorId === monitor.id}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingMonitorId === monitor.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AuthScreen({
  onAuthenticate,
  onClearError,
  isSubmitting,
  error,
}) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState(null);

  function selectMode(nextMode) {
    setMode(nextMode);
    setConfirmPassword("");
    setValidationError(null);
    onClearError();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (mode === "register" && password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setValidationError(null);
    const authenticated = await onAuthenticate(mode, { username, password });

    if (authenticated) {
      setConfirmPassword("");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-950/50">
            <Activity size={28} />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
            DeployBoard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Your cloud-native uptime monitoring workspace
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur">
          <div className="grid grid-cols-2 rounded-xl bg-slate-900 p-1">
            {[
              ["login", "Login"],
              ["register", "Register"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => selectMode(id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === id
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "login"
                ? "Sign in to view your monitors and incidents."
                : "Start with a private monitoring workspace."}
            </p>
          </div>

          {(validationError || error) && (
            <div
              className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {validationError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="auth-username"
                className="text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Username
              </label>
              <input
                id="auth-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                maxLength={32}
                pattern="[a-z0-9_-]+"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none ring-sky-500/40 placeholder:text-slate-600 focus:ring-2"
                placeholder="your_username"
              />
              <p className="mt-2 text-xs text-slate-500">
                3-32 characters: lowercase letters, numbers, underscore, or hyphen.
              </p>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Password
              </label>
              <input
                id="auth-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setValidationError(null);
                }}
                required
                type="password"
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none ring-sky-500/40 placeholder:text-slate-600 focus:ring-2"
                placeholder="Minimum 8 characters"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use at least 8 characters.
              </p>
            </div>

            {mode === "register" && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Confirm password
                </label>
                <input
                  id="auth-confirm-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setValidationError(null);
                  }}
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none ring-sky-500/40 placeholder:text-slate-600 focus:ring-2"
                  placeholder="Re-enter your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-950/40 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-300">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-4 shadow-xl shadow-slate-950/40">
        <Loader2 className="animate-spin text-sky-400" size={20} />
        Restoring your session...
      </div>
    </div>
  );
}

export default function App() {
  const [accessToken, setAccessToken] = useState(() =>
    window.localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const activeTokenRef = useRef(accessToken);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() =>
    Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY))
  );
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [monitors, setMonitors] = useState([]);
  const [checksByMonitor, setChecksByMonitor] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [checkingMonitorId, setCheckingMonitorId] = useState(null);
  const [editingMonitorId, setEditingMonitorId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    url: "",
    expected_status: 200,
    check_interval_seconds: 300,
  });
  const [deletingMonitorId, setDeletingMonitorId] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [selectedMonitorId, setSelectedMonitorId] = useState("");
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    activeTokenRef.current = null;
    setAccessToken(null);
    setCurrentUser(null);
    setMonitors([]);
    setChecksByMonitor({});
    setIncidents([]);
    setActiveView("dashboard");
    setEditingMonitorId(null);
    setSelectedMonitorId("");
    setCheckingMonitorId(null);
    setDeletingMonitorId(null);
    setError(null);
    setIsLoading(true);
    setIsAuthLoading(false);
  }, []);

  const handleProtectedError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        clearSession();
        setAuthError("Your session expired. Please sign in again.");
        return;
      }

      setError(err.message || "Something went wrong. Please try again.");
    },
    [clearSession]
  );

  useEffect(() => {
    if (!accessToken || currentUser) {
      return undefined;
    }

    let isCancelled = false;
    const restoreSessionId = window.setTimeout(async () => {
      try {
        const user = await getCurrentUser(accessToken);

        if (!isCancelled) {
          setCurrentUser(user);
          setAuthError(null);
          setIsAuthLoading(false);
        }
      } catch (err) {
        if (isCancelled) {
          return;
        }

        if (err.status === 401 || err.status === 403) {
          clearSession();
          setAuthError("Your session expired. Please sign in again.");
        } else {
          setAuthError(err.message || "Unable to restore your session.");
          setIsAuthLoading(false);
        }
      }
    }, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(restoreSessionId);
    };
  }, [accessToken, currentUser, clearSession]);

  const loadDashboard = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const requestToken = accessToken;

    try {
      setError(null);
      const monitorList = await listMonitors(requestToken);

      if (activeTokenRef.current !== requestToken) {
        return;
      }

      setMonitors(monitorList);

      const checkEntries = await Promise.all(
        monitorList.map(async (monitor) => {
          const checks = await listMonitorChecks(monitor.id, requestToken);
          return [monitor.id, checks];
        })
      );

      if (activeTokenRef.current !== requestToken) {
        return;
      }

      setChecksByMonitor(Object.fromEntries(checkEntries));

      const incidentList = await listIncidents(requestToken);

      if (activeTokenRef.current !== requestToken) {
        return;
      }

      setIncidents(incidentList);
    } catch (err) {
      handleProtectedError(err);
    } finally {
      if (activeTokenRef.current === requestToken) {
        setIsLoading(false);
      }
    }
  }, [accessToken, handleProtectedError]);

  useEffect(() => {
    if (!accessToken || !currentUser) {
      return undefined;
    }

    const initialLoadId = window.setTimeout(loadDashboard, 0);
    const intervalId = window.setInterval(loadDashboard, 10000);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [accessToken, currentUser, loadDashboard]);

  async function handleAuthenticate(mode, payload) {
    try {
      setIsAuthSubmitting(true);
      setAuthError(null);

      if (mode === "register") {
        await registerUser(payload);
      }

      const tokenResponse = await loginUser(payload);
      const token = tokenResponse.access_token;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setIsAuthLoading(true);

      const user = await getCurrentUser(token);
      activeTokenRef.current = token;
      setAccessToken(token);
      setCurrentUser(user);
      setIsLoading(true);
      setIsAuthLoading(false);
      return true;
    } catch (err) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      activeTokenRef.current = null;
      setAccessToken(null);
      setCurrentUser(null);
      setIsAuthLoading(false);
      setAuthError(err.message || "Authentication failed. Please try again.");
      return false;
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  function handleLogout() {
    clearSession();
    setAuthError(null);
  }

  async function handleCreateMonitor(payload) {
    try {
      setIsCreating(true);
      setError(null);
      await createMonitor(payload, accessToken);
      await loadDashboard();
    } catch (err) {
      handleProtectedError(err);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRunCheck(monitorId) {
    try {
      setCheckingMonitorId(monitorId);
      setError(null);
      await runMonitorCheck(monitorId, accessToken);
      await loadDashboard();
    } catch (err) {
      handleProtectedError(err);
    } finally {
      setCheckingMonitorId(null);
    }
  }

  function startEditMonitor(monitor) {
    setEditingMonitorId(monitor.id);
    setEditForm({
      name: monitor.name,
      url: monitor.url,
      expected_status: monitor.expected_status,
      check_interval_seconds: monitor.check_interval_seconds,
    });
  }

  function cancelEditMonitor() {
    setEditingMonitorId(null);
    setEditForm({
      name: "",
      url: "",
      expected_status: 200,
      check_interval_seconds: 300,
    });
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpdateMonitor(event) {
    event.preventDefault();

    if (!editingMonitorId) {
      return;
    }

    try {
      setIsSavingEdit(true);
      setError(null);

      await updateMonitor(
        editingMonitorId,
        {
          name: editForm.name,
          url: editForm.url,
          expected_status: Number(editForm.expected_status),
          check_interval_seconds: Number(editForm.check_interval_seconds),
        },
        accessToken
      );

      cancelEditMonitor();
      await loadDashboard();
    } catch (err) {
      handleProtectedError(err);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteMonitor(monitor) {
    const confirmed = window.confirm(
      `Delete monitor "${monitor.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMonitorId(monitor.id);
      setError(null);

      await deleteMonitor(monitor.id, accessToken);

      if (editingMonitorId === monitor.id) {
        cancelEditMonitor();
      }

      if (selectedMonitor?.id === monitor.id) {
        const nextMonitor = monitors.find((item) => item.id !== monitor.id);
        setSelectedMonitorId(nextMonitor?.id || "");
      }

      await loadDashboard();
    } catch (err) {
      handleProtectedError(err);
    } finally {
      setDeletingMonitorId(null);
    }
  }

  const stats = useMemo(() => {
    const total = monitors.length;
    const up = monitors.filter((monitor) => monitor.status === "UP").length;
    const down = monitors.filter((monitor) => monitor.status === "DOWN").length;

    const responseTimes = monitors
      .map((monitor) => checksByMonitor[monitor.id]?.[0]?.response_time_ms)
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

  const selectedMonitor =
    monitors.find((monitor) => monitor.id === selectedMonitorId) ||
    monitors[0] ||
    null;

  const selectedMonitorChecks = checksByMonitor[selectedMonitor?.id] || [];
  const chartData = selectedMonitorChecks
    .slice()
    .reverse()
    .map((check) => ({
      time: new Date(check.checked_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      response: check.response_time_ms || 0,
    }));

  const visibleIncidents = useMemo(() => {
    const monitorIds = new Set(monitors.map((monitor) => monitor.id));

    return incidents.filter((incident) => monitorIds.has(incident.monitor_id));
  }, [incidents, monitors]);

  const recentIncidents = visibleIncidents.slice(0, 3);
  const activeViewDetails = viewDetails[activeView];

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!currentUser) {
    return (
      <AuthScreen
        onAuthenticate={handleAuthenticate}
        onClearError={() => setAuthError(null)}
        isSubmitting={isAuthSubmitting}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-slate-800 bg-slate-950/80 p-6 backdrop-blur lg:flex">
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
          {navigationItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-sky-500/10 text-sky-300"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="truncate text-sm font-semibold text-slate-200">
                {currentUser.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="border-b border-slate-800 bg-slate-950/50 px-6 py-5 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{activeViewDetails.subtitle}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                {activeViewDetails.title}
              </h2>
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

          {activeView === "monitors" && (
            <AddMonitorForm onCreate={handleCreateMonitor} isCreating={isCreating} />
          )}

          {activeView === "monitors" && editingMonitorId && (
            <form
              onSubmit={handleUpdateMonitor}
              className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6 shadow-xl shadow-slate-950/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Edit monitor</h3>
                  <p className="text-sm text-slate-400">
                    Update monitor configuration.
                  </p>
                </div>
                <div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
                  <Pencil size={20} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(event) => updateEditField("name", event.target.value)}
                    required
                    minLength={2}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 focus:ring-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    URL
                  </label>
                  <input
                    value={editForm.url}
                    onChange={(event) => updateEditField("url", event.target.value)}
                    required
                    type="url"
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 focus:ring-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Expected
                  </label>
                  <input
                    value={editForm.expected_status}
                    onChange={(event) =>
                      updateEditField("expected_status", event.target.value)
                    }
                    required
                    type="number"
                    min={100}
                    max={599}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 focus:ring-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Interval seconds
                  </label>
                  <input
                    value={editForm.check_interval_seconds}
                    onChange={(event) =>
                      updateEditField("check_interval_seconds", event.target.value)
                    }
                    required
                    type="number"
                    min={60}
                    max={86400}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 focus:ring-2"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-950/40 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingEdit ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Pencil size={18} />
                  )}
                  Save changes
                </button>

                <button
                  type="button"
                  onClick={cancelEditMonitor}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activeView === "dashboard" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Globe2} label="Total monitors" value={stats.total} helper="active" />
                <StatCard icon={CheckCircle2} label="Services up" value={stats.up} helper="healthy" />
                <StatCard icon={AlertTriangle} label="Services down" value={stats.down} helper="needs attention" />
                <StatCard icon={Activity} label="Avg response" value={stats.avgResponse} helper="last checks" />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 xl:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-white">Response time</h3>
                  <p className="text-sm text-slate-500">
                    {selectedMonitor
                      ? `Latest checks for ${selectedMonitor.name}`
                      : "Latest monitor check history"}
                  </p>
                </div>

                <div className="sm:min-w-56">
                  <label
                    htmlFor="response-time-monitor"
                    className="sr-only"
                  >
                    Select monitor for response time chart
                  </label>
                  <select
                    id="response-time-monitor"
                    value={selectedMonitor?.id || ""}
                    onChange={(event) => setSelectedMonitorId(event.target.value)}
                    disabled={monitors.length === 0}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 focus:ring-2 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    {monitors.length === 0 ? (
                      <option value="">No monitors available</option>
                    ) : (
                      monitors.map((monitor) => (
                        <option key={monitor.id} value={monitor.id}>
                          {monitor.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="mt-6 h-72">
                {monitors.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 px-6 text-center text-sm text-slate-500">
                    Add a monitor to start tracking response times.
                  </div>
                ) : chartData.length === 0 ? (
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
              <MonitorTable
                monitors={monitors}
                checksByMonitor={checksByMonitor}
                isLoading={isLoading}
                checkingMonitorId={checkingMonitorId}
                onCheck={handleRunCheck}
              />
            </>
          )}

          {activeView === "monitors" && (
            <MonitorTable
              monitors={monitors}
              checksByMonitor={checksByMonitor}
              isLoading={isLoading}
              checkingMonitorId={checkingMonitorId}
              deletingMonitorId={deletingMonitorId}
              onCheck={handleRunCheck}
              onEdit={startEditMonitor}
              onDelete={handleDeleteMonitor}
              showCrudActions
            />
          )}

          {activeView === "incidents" && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl shadow-slate-950/30">
              <div className="border-b border-slate-800 px-6 py-5">
                <h3 className="font-semibold text-white">Incident history</h3>
                <p className="text-sm text-slate-500">
                  Active and resolved incidents for current monitors
                </p>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                    <Loader2 className="animate-spin" size={18} />
                    Loading incidents...
                  </div>
                ) : visibleIncidents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-400" size={28} />
                    <p className="mt-3 text-sm font-medium text-slate-200">
                      No incidents to show
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Active and resolved monitor incidents will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleIncidents.map((incident) => {
                      const isActive = incident.status === "ACTIVE";
                      const incidentDetail = [
                        incident.last_error,
                        incident.last_status_code != null
                          ? `HTTP ${incident.last_status_code}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "No error details available";

                      return (
                        <article
                          key={incident.id}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="font-medium text-white">
                                {incident.monitor_name}
                              </h4>
                              {incident.monitor_url && (
                                <p className="mt-1 break-all text-xs text-slate-500">
                                  {incident.monitor_url}
                                </p>
                              )}
                            </div>
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? "bg-red-500/10 text-red-300 ring-1 ring-red-500/30"
                                  : "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
                              }`}
                            >
                              {incident.status}
                            </span>
                          </div>

                          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Details
                              </p>
                              <p className="mt-1 text-slate-300">{incidentDetail}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Started
                              </p>
                              <p className="mt-1 text-slate-300">
                                {new Date(incident.started_at).toLocaleString()}
                              </p>
                            </div>
                            {incident.resolved_at && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                  Resolved
                                </p>
                                <p className="mt-1 text-slate-300">
                                  {new Date(incident.resolved_at).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === "status-pages" && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                    <Globe2 size={24} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    Share service health clearly
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Public status pages are coming soon. Soon you will be able to
                    choose monitors, publish a public status URL, and share service
                    health with users.
                  </p>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                    {monitors.length > 0
                      ? `You currently have ${monitors.length} ${
                          monitors.length === 1 ? "monitor" : "monitors"
                        } that could be published to a status page.`
                      : "Create monitors first, then publish selected services to a status page."}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
                    >
                      <Plus size={18} />
                      Create Status Page
                    </button>
                    <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/30">
                      Coming soon
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Preview
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">
                        DeployBoard Status
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                      All systems operational
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {sampleStatusServices.map((service) => (
                      <div
                        key={service}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-200">
                          {service}
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Operational
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/70">
                      Recent incident
                    </p>
                    <p className="mt-1 text-sm font-medium text-emerald-200">
                      No active incidents
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
                <div>
                  <h3 className="font-semibold text-white">Planned capabilities</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Everything needed for a clear, useful public status experience.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {plannedStatusPageFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
                    >
                      <CheckCircle2 className="shrink-0 text-sky-400" size={17} />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
