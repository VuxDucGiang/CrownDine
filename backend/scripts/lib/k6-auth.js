import http from "k6/http";

export function ensureBearer(token) {
  if (!token) return "";
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

export function loginAndGetToken({ baseUrl, loginPath = "/api/auth/login", username, password }) {
  const url = `${baseUrl}${loginPath}`;
  const res = http.post(url, JSON.stringify({ username, password }), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "LoginRequest" },
  });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${username}: status=${res.status}, body=${res.body}`);
  }

  let accessToken = "";
  try {
    const body = JSON.parse(res.body);
    accessToken = body?.accessToken || "";
  } catch (e) {
    throw new Error(`Login parse failed for ${username}: ${e}`);
  }

  if (!accessToken) {
    throw new Error(`Login response missing accessToken for ${username}`);
  }

  return accessToken;
}

export function buildTokenPool({ baseUrl, loginPath = "/api/auth/login", usernames = [], password = "123456" }) {
  if (!Array.isArray(usernames) || usernames.length === 0) {
    throw new Error("No usernames provided for buildTokenPool");
  }

  return usernames.map((username) =>
    loginAndGetToken({
      baseUrl,
      loginPath,
      username,
      password,
    }),
  );
}

export function pickTokenByVu(tokens, vu) {
  if (!tokens || tokens.length === 0) {
    throw new Error("No tokens available");
  }
  return tokens[(vu - 1) % tokens.length];
}
