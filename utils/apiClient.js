const buildUrl = (path) => {
  const baseUrl = import.meta.env?.VITE_API_BASE_URL ?? "/api";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
};

const request = async (path, options = {}) => {
  const url = buildUrl(path);
  console.log("Fetching:", url);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || "API request failed.");
    error.status = response.status;
    error.details = errorBody;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  patch: (path, body) =>
    request(path, {
      method: "PATCH",
      body: JSON.stringify(body ?? {}),
    }),
  delete: (path) =>
    request(path, {
      method: "DELETE",
    }),
};
