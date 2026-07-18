export function parseProjectPath(gitlabUrl: string): string {
  const url = new URL(gitlabUrl);
  const path = url.pathname.replace(/^\/|\.git$|\/$/g, "");
  if (!path) {
    throw new Error("Couldn't parse a project path from that GitLab URL.");
  }
  return path;
}

export async function gitlabFetch(host: string, path: string, token?: string): Promise<Response> {
  const response = await fetch(`https://${host}/api/v4${path}`, {
    headers: token ? { "PRIVATE-TOKEN": token } : {},
  });
  if (!response.ok) {
    throw new Error(
      `GitLab API request failed (${response.status}). Check the repo URL${token ? "" : " or add a GitLab token in Profile Settings if this is a private repo"}.`,
    );
  }
  return response;
}

export async function gitlabFetchJson<T>(host: string, path: string, token?: string): Promise<T> {
  const response = await gitlabFetch(host, path, token);
  return response.json() as Promise<T>;
}
