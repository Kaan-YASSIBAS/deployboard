import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import App from "./App";

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }) => <div>{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const TOKEN_STORAGE_KEY = "deployboard_access_token";
const TOKEN = "test-access-token";
const CURRENT_USER = {
  id: "user-1",
  username: "test_user",
  created_at: "2026-07-03T10:00:00Z",
};

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(body == null ? "" : JSON.stringify(body)),
  };
}

function monitor(id, name) {
  return {
    id,
    user_id: CURRENT_USER.id,
    name,
    url: `https://${id}.example.com`,
    expected_status: 200,
    check_interval_seconds: 300,
    status: "UP",
  };
}

function check(id, responseTime, checkedAt) {
  return {
    id,
    response_time_ms: responseTime,
    status_code: 200,
    checked_at: checkedAt,
  };
}

function requestPath(url) {
  return new URL(url, window.location.origin).pathname;
}

function findRequest(fetchMock, path, method = "GET") {
  return fetchMock.mock.calls.find(
    ([url, options = {}]) =>
      requestPath(url) === path && (options.method || "GET") === method
  );
}

function installFetchMock({
  monitors = [],
  checksByMonitor = {},
  incidents = [],
  authMeStatus = 200,
} = {}) {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || "GET";
    const path = requestPath(url);

    if (path === "/api/v1/auth/register" && method === "POST") {
      return jsonResponse(CURRENT_USER, 201);
    }

    if (path === "/api/v1/auth/login" && method === "POST") {
      return jsonResponse({ access_token: TOKEN, token_type: "bearer" });
    }

    if (path === "/api/v1/auth/me") {
      if (authMeStatus === 401 || authMeStatus === 403) {
        return jsonResponse(
          { detail: "Could not validate credentials" },
          authMeStatus
        );
      }

      return jsonResponse(CURRENT_USER);
    }

    if (path === "/api/v1/monitors" && method === "GET") {
      return jsonResponse(monitors);
    }

    const checkHistoryMatch = path.match(
      /^\/api\/v1\/monitors\/([^/]+)\/checks$/
    );
    if (checkHistoryMatch && method === "GET") {
      return jsonResponse(checksByMonitor[checkHistoryMatch[1]] || []);
    }

    if (path === "/api/v1/incidents" && method === "GET") {
      return jsonResponse(incidents);
    }

    throw new Error(`Unhandled fetch request: ${method} ${url}`);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderApp(options) {
  const fetchMock = installFetchMock(options);
  render(<App />);
  return fetchMock;
}

async function renderAuthenticated(options) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
  const fetchMock = renderApp(options);

  await screen.findByRole("heading", { name: "Dashboard", level: 2 });
  await waitFor(() =>
    expect(findRequest(fetchMock, "/api/v1/incidents")).toBeDefined()
  );

  return fetchMock;
}

async function completeCredentials(user, { confirmPassword = false } = {}) {
  await user.type(screen.getByLabelText("Username"), "test_user");
  await user.type(screen.getByLabelText("Password"), "password123");

  if (confirmPassword) {
    await user.type(screen.getByLabelText("Confirm password"), "password123");
  }
}

describe("authentication", () => {
  it("shows the login screen when no token exists", () => {
    const fetchMock = renderApp();

    expect(
      screen.getByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows Confirm password only in register mode", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.queryByLabelText("Confirm password")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("rejects mismatched registration passwords without calling the API", async () => {
    const user = userEvent.setup();
    const fetchMock = renderApp();

    await user.click(screen.getByRole("button", { name: "Register" }));
    await completeCredentials(user);
    await user.type(screen.getByLabelText("Confirm password"), "different123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("registers matching passwords through the register endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = renderApp();

    await user.click(screen.getByRole("button", { name: "Register" }));
    await completeCredentials(user, { confirmPassword: true });
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await screen.findByRole("heading", { name: "Dashboard", level: 2 });
    expect(findRequest(fetchMock, "/api/v1/auth/register", "POST")?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          username: "test_user",
          password: "password123",
        }),
      })
    );
  });

  it("logs in through the login endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = renderApp();

    await completeCredentials(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByRole("heading", { name: "Dashboard", level: 2 });
    expect(findRequest(fetchMock, "/api/v1/auth/login", "POST")?.[1]).toEqual(
      expect.objectContaining({ method: "POST" })
    );
  });

  it("restores an existing token through auth/me", async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    const fetchMock = renderApp();

    await screen.findByRole("heading", { name: "Dashboard", level: 2 });
    expect(findRequest(fetchMock, "/api/v1/auth/me")?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      })
    );
  });

  it.each([401, 403])(
    "clears an invalid token after a %s auth/me response",
    async (status) => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
      renderApp({ authMeStatus: status });

      await screen.findByRole("heading", { name: "Welcome back" });
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Your session expired. Please sign in again."
      );
    }
  );
});

describe("dashboard views", () => {
  it("switches between every sidebar view", async () => {
    const user = userEvent.setup();
    await renderAuthenticated();

    for (const view of ["Monitors", "Incidents", "Status Pages", "Dashboard"]) {
      await user.click(screen.getByRole("button", { name: view }));
      expect(
        screen.getByRole("heading", { name: view, level: 2 })
      ).toBeInTheDocument();
    }
  });

  it("shows Check only on Dashboard and full actions on Monitors", async () => {
    const user = userEvent.setup();
    await renderAuthenticated({ monitors: [monitor("api", "API")] });

    let table = await screen.findByRole("table");
    expect(within(table).getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(within(table).queryByRole("button", { name: "Edit" })).toBeNull();
    expect(within(table).queryByRole("button", { name: "Delete" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Monitors" }));
    table = screen.getByRole("table");
    expect(within(table).getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows status-page guidance for existing monitors", async () => {
    const user = userEvent.setup();
    await renderAuthenticated({
      monitors: [monitor("api", "API"), monitor("web", "Frontend")],
    });

    await user.click(screen.getByRole("button", { name: "Status Pages" }));
    expect(
      screen.getByText(
        "You currently have 2 monitors that could be published to a status page."
      )
    ).toBeInTheDocument();
  });

  it("shows create-monitor-first status-page guidance with no monitors", async () => {
    const user = userEvent.setup();
    await renderAuthenticated();

    await user.click(screen.getByRole("button", { name: "Status Pages" }));
    expect(
      screen.getByText(
        "Create monitors first, then publish selected services to a status page."
      )
    ).toBeInTheDocument();
  });
});

describe("dashboard statistics", () => {
  it("averages each latest response once and keeps the chart selector independent", async () => {
    const user = userEvent.setup();
    const monitors = [monitor("api", "API"), monitor("web", "Frontend")];

    await renderAuthenticated({
      monitors,
      checksByMonitor: {
        api: [
          check("api-new", 100, "2026-07-03T10:02:00Z"),
          check("api-old", 900, "2026-07-03T10:01:00Z"),
        ],
        web: [
          check("web-new", 300, "2026-07-03T10:02:00Z"),
          check("web-old", 700, "2026-07-03T10:01:00Z"),
        ],
      },
    });

    const avgResponseCard = (await screen.findByText("Avg response")).parentElement;
    expect(within(avgResponseCard).getByText("200ms")).toBeInTheDocument();
    expect(screen.getByText("Latest checks for API")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Select monitor for response time chart"),
      "web"
    );

    expect(screen.getByText("Latest checks for Frontend")).toBeInTheDocument();
    expect(within(avgResponseCard).getByText("200ms")).toBeInTheDocument();
  });
});
