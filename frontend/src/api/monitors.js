const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function errorMessage(errorBody, status) {
  const detail = errorBody?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = (item.loc || [])
          .filter((part) => part !== "body")
          .join(".");

        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join(" ");
  }

  return `Request failed with status ${status}`;
}

async function request(path, options = {}) {
  const { token, headers, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorBody;

    try {
      errorBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      errorBody = null;
    }

    throw new ApiError(
      errorBody ? errorMessage(errorBody, response.status) : responseText,
      response.status,
      errorBody
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function registerUser(payload) {
  return request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(token) {
  return request("/api/v1/auth/me", { token });
}

export function listMonitors(token) {
  return request("/api/v1/monitors", { token });
}

export function createMonitor(payload, token) {
  return request("/api/v1/monitors", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function updateMonitor(monitorId, payload, token) {
  return request(`/api/v1/monitors/${monitorId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteMonitor(monitorId, token) {
  return request(`/api/v1/monitors/${monitorId}`, {
    method: "DELETE",
    token,
  });
}

export function runMonitorCheck(monitorId, token) {
  return request(`/api/v1/monitors/${monitorId}/check`, {
    method: "POST",
    token,
  });
}

export function listMonitorChecks(monitorId, token) {
  return request(`/api/v1/monitors/${monitorId}/checks`, { token });
}

export function listIncidents(token) {
  return request("/api/v1/incidents", { token });
}

export function listActiveIncidents(token) {
  return request("/api/v1/incidents/active", { token });
}
