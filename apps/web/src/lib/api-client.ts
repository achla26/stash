import axios from "axios";

// Empty base = same-origin (Next proxy). "undefined/api/..." URL banane ka bug fix.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshInFlight: Promise<any> | null = null;

// Request — token attach
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response — unwrap ApiSuccess<T> + handle errors + token refresh
apiClient.interceptors.response.use(
  // Success — return response.data directly (ApiSuccess<T> shape)
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url: string = originalRequest?.url ?? "";

    // Pad routes pe 401 redirect mat karo (wrong password = 401)
    const isPadRoute = url.includes("/api/pads");

    if (status === 401 && !originalRequest._retry && !isPadRoute) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          // single-flight: parallel 401s share one refresh call
          if (!refreshInFlight) {
            refreshInFlight = axios.post(
              `${API_BASE}/api/auth/refresh`,
              { refreshToken },
              { headers: { "Content-Type": "application/json" } }
            ).finally(() => {
              setTimeout(() => (refreshInFlight = null), 100);
            });
          }
          const res = await refreshInFlight;

          // res.data is ApiSuccess<AuthResponse>
          const session = res.data?.data?.session;
          if (session?.accessToken) {
            localStorage.setItem("access_token", session.accessToken);
            localStorage.setItem("refresh_token", session.refreshToken);

            originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Refresh failed — logout
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const publicRoutes = ["/pad", "/login", "/signup", "/"];
        const isPublicRoute = publicRoutes.some((r) =>
          pathname.startsWith(r)
        );
        if (!isPublicRoute) {
          window.location.href = "/login";
        }
      }
    }

    const errorData = error.response?.data;
    if (errorData && !(errorData instanceof Error)) {
      const message =
        (errorData as { error?: { message?: string } }).error?.message ??
        (errorData as { message?: string }).message ??
        "Request failed";
      return Promise.reject(new Error(message));
    }

    return Promise.reject(error);
  }
);