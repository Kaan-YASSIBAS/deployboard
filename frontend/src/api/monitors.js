const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function listMonitors() {
  return request("/api/v1/monitors");
}

export function createMonitor(payload) {
  return request("/api/v1/monitors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function runMonitorCheck(monitorId) {
  return request(`/api/v1/monitors/${monitorId}/check`, {
    method: "POST",
  });
}

export function listMonitorChecks(monitorId) {
  return request(`/api/v1/monitors/${monitorId}/checks`);
}