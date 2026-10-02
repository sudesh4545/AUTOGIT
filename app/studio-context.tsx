"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Project = {
  id: string;
  title: string;
  description: string;
  collection: "small" | "mini";
  status: "queued" | "uploading" | "publishing" | "published" | "failed";
  createdAt: string;
  publishedAt: string | null;
  githubUrl: string | null;
  error: string | null;
  fileCount: number;
  technologies: string;
  demoUrl: string | null;
};

type Connection = {
  githubConnected: boolean;
  storageReady: boolean;
  portfolioTarget: string;
};

type StudioState = {
  projects: Project[];
  connection: Connection;
  botEnabled: boolean | null;
  loading: boolean;
  error: string;
  uploaderOpen: boolean;
  setUploaderOpen: (open: boolean) => void;
  accessKey: string;
  setAccessKey: (key: string) => void;
  refresh: () => Promise<void>;
  upload: (details: {
    title: string;
    description: string;
    collection: "small" | "mini";
    technologies: string;
    demoUrl: string;
    files: File[];
  }) => Promise<void>;
};

const StudioContext = createContext<StudioState | null>(null);

export function workspaceHeaders(headers: HeadersInit = {}) {
  const key = typeof window === "undefined" ? "" : window.sessionStorage.getItem("autogit-access-key") || "";
  return key ? { ...headers, "X-AutoGit-Key": key } : headers;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4500);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal, headers: workspaceHeaders() });
  } finally {
    window.clearTimeout(timer);
  }
}

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio provider is missing.");
  return value;
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [connection, setConnection] = useState<Connection>({
    githubConnected: false,
    storageReady: false,
    portfolioTarget: "sudesh4545/sudesh-portfolio",
  });
  const [loading, setLoading] = useState(true);
  const [botEnabled] = useState<boolean | null>(true);
  const [error, setError] = useState("");
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [accessKey, setAccessKeyState] = useState("");

  const setAccessKey = useCallback((key: string) => {
    const value = key.trim();
    if (value) window.sessionStorage.setItem("autogit-access-key", value);
    else window.sessionStorage.removeItem("autogit-access-key");
    setAccessKeyState(value);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [projectResponse, statusResponse] = await Promise.all([
        fetchWithTimeout("/api/projects"),
        fetchWithTimeout("/api/status"),
      ]);
      const projectData = await projectResponse.json() as { projects?: Project[]; error?: string };
      const statusData = await statusResponse.json() as Partial<Connection>;
      if (!projectResponse.ok) throw new Error(projectResponse.status === 401 ? "Unlock this private workspace to manage projects and the bot." : projectData.error || "Project data is unavailable.");
      setProjects(projectData.projects || []);
      if (statusResponse.ok) setConnection({
        githubConnected: Boolean(statusData.githubConnected),
        storageReady: Boolean(statusData.storageReady),
        portfolioTarget: statusData.portfolioTarget || "sudesh4545/sudesh-portfolio",
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load studio data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [refresh]);

  const upload: StudioState["upload"] = async details => {
    const total = details.files.reduce((sum, file) => sum + file.size, 0);
    if (!details.files.length) throw new Error("Choose a project folder.");
    if (details.files.length > 40 || total > 5 * 1024 * 1024) {
      throw new Error("Choose up to 40 files under 5 MB total.");
    }
    const files = await Promise.all(details.files.map(async file => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 32768) {
        binary += String.fromCharCode(...bytes.slice(index, index + 32768));
      }
      return { path: file.webkitRelativePath || file.name, size: file.size, content: btoa(binary) };
    }));
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: workspaceHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ...details, files }),
    });
    const data = await response.json() as { project?: Project; error?: string };
    if (!response.ok || !data.project) throw new Error(data.error || "Project upload failed.");
    setProjects(current => [data.project!, ...current]);
    setUploaderOpen(false);
  };

  return <StudioContext.Provider value={{
    projects, connection, botEnabled, loading, error, uploaderOpen, setUploaderOpen, accessKey, setAccessKey, refresh, upload,
  }}>{children}</StudioContext.Provider>;
}
