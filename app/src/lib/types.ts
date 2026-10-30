export type Account = {
  name: string;
  provider: string;
  label: string;
  /** Autorizada com um client_id próprio (a cota do Google é só desta conta). */
  customClient: boolean;
};

export type Profile = {
  id: string;
  account: string;
  remotePath: string;
  localPath: string;
  enabled: boolean;
  resyncNeeded: boolean;
  lastSync: number | null;
  lastError: string | null;
  lastBytes: number;
};

export type NewProfile = {
  account: string;
  remotePath: string;
  localPath: string;
  enabled: boolean;
};

export type Transfer = {
  name: string;
  size: number;
  bytes: number;
  percent: number;
  speed: number;
  eta: number | null;
};

export type Snapshot = {
  engineReady: boolean;
  paused: boolean;
  running: boolean;
  speed: number;
  bytes: number;
  totalBytes: number;
  errors: number;
  transfers: Transfer[];
  jobs: number;
};

export type EngineStatus = {
  available: boolean;
  version: string | null;
  binary: string | null;
  accounts: number;
};

export type FileChange = {
  name: string;
  action: "sent" | "received" | "deletedRemote" | "deletedLocal";
};

export type ActivityEntry = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: number;
  profile: string | null;
  /** O que cada arquivo fez nesta sincronização (vazio = nada mudou). */
  files?: FileChange[];
};

export type Settings = {
  theme: string;
  bandwidthUp: string;
  bandwidthDown: string;
  notifications: boolean;
  ignoreRules: string[];
  proxy: string;
  docsConversion: boolean;
  symlinks: boolean;
  autoRetry: boolean;
  autoSync: boolean;
  syncIntervalMin: number;
  /** Credenciais OAuth próprias do Google Drive; vazias = projeto do rclone. */
  driveClientId: string;
  driveClientSecret: string;
};

export type FolderSize = {
  count: number;
  bytes: number;
  sizeless: number;
};

export type RemoteEntry = {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modified: string | null;
};

export type Conflict = {
  id: string;
  folder: string;
  localFolder: string;
  baseName: string;
  path1: string | null;
  path2: string | null;
  path1Size: number | null;
  path2Size: number | null;
  path1Modified: number | null;
  path2Modified: number | null;
};

export type AccountUsage = {
  account: string;
  label: string;
  provider: string;
  total: number | null;
  used: number | null;
  free: number | null;
  error: string | null;
  /** Os números vieram de uma leitura anterior (a atual falhou). */
  stale: boolean;
};

export type ViewId =
  | "dashboard"
  | "files"
  | "folders"
  | "activity"
  | "conflicts"
  | "settings";
