import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { CommandPalette, type PaletteAction } from "./components/CommandPalette";
import { Icon, type IconName } from "./components/Icons";
import { Modal } from "./components/Modal";
import { Sidebar } from "./components/Sidebar";
import { Toasts, type ToastItem, type ToastKind } from "./components/Toasts";
import { TopBar } from "./components/TopBar";
import { api, errorMessage, isDesktop, subscribe } from "./lib/bridge";
import { parentPath } from "./lib/format";
import type {
  Account,
  AccountUsage,
  ActivityEntry,
  EngineStatus,
  Profile,
  Settings,
  RemoteEntry,
  Snapshot,
  ViewId,
} from "./lib/types";
import { Activity } from "./views/Activity";
import { Conflicts } from "./views/Conflicts";
import { Dashboard } from "./views/Dashboard";
import { Files } from "./views/Files";
import { Folders } from "./views/Folders";
import { Settings as SettingsView } from "./views/Settings";

const EMPTY_SNAPSHOT: Snapshot = {
  engineReady: false,
  paused: false,
  running: false,
  speed: 0,
  bytes: 0,
  totalBytes: 0,
  errors: 0,
  transfers: [],
  jobs: 0,
};

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  bandwidthUp: "",
  bandwidthDown: "",
  notifications: true,
  ignoreRules: [],
  proxy: "",
  docsConversion: false,
  symlinks: false,
  autoRetry: true,
  autoSync: true,
  syncIntervalMin: 5,
  driveClientId: "",
  driveClientSecret: "",
};

const TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard: { title: "Visão geral", subtitle: "O estado das suas pastas em uma olhada" },
  files: { title: "Arquivos", subtitle: "Navegue pela nuvem sem baixar nada" },
  folders: { title: "Pastas", subtitle: "Escolha o que fica igual nos dois lados" },
  activity: { title: "Atividade", subtitle: "Envios, conflitos e erros em ordem" },
  conflicts: { title: "Conflitos", subtitle: "Nada é sobrescrito sem você ver" },
  settings: { title: "Ajustes", subtitle: "Contas, banda e comportamento do app" },
};

function initialTheme(): "light" | "dark" {
  const stored = localStorage.getItem("nuvem.theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [engine, setEngine] = useState<EngineStatus | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [filesAccount, setFilesAccount] = useState("");
  const [filesPath, setFilesPath] = useState("");
  const [autostart, setAutostart] = useState(false);
  const [autostartBusy, setAutostartBusy] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);
  const [usage, setUsage] = useState<AccountUsage[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(1);

  const notify = useCallback((message: string, kind: ToastKind = "info") => {
    const id = toastId.current++;
    setToasts((items) => [...items, { id, message, kind }]);
    setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const refreshProfiles = useCallback(async () => {
    setProfiles(await api.listProfiles());
  }, []);

  const refreshActivity = useCallback(async () => {
    setActivity(await api.recentActivity());
  }, []);

  const clearActivity = useCallback(async () => {
    try {
      await api.clearActivity();
      setActivity([]);
      notify("Histórico de atividade limpo.", "ok");
    } catch (cause) {
      notify(errorMessage(cause), "error");
      void refreshActivity();
    }
  }, [notify, refreshActivity]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nuvem.theme", theme);
    // A bandeja acompanha o tema: preto no claro, branco no escuro.
    void api.setTrayTheme(theme === "dark").catch(() => undefined);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [engineStatus, accountList, profileList, info] = await Promise.all([
          api.engineStatus(),
          api.listAccounts(),
          api.listProfiles(),
          api.getSettings(),
        ]);
        if (cancelled) return;
        setEngine(engineStatus);
        setAccounts(accountList);
        // Mantém a conta escolhida em Arquivos; só cai para a primeira quando ela
        // não existe mais (conta removida) ou na primeira abertura.
        setFilesAccount((atual) =>
          accountList.some((item) => item.name === atual) ? atual : accountList[0]?.name ?? "",
        );
        setProfiles(profileList);
        setSettings({ ...DEFAULT_SETTINGS, ...info });
        setAutostart(await api.autostartEnabled().catch(() => false));
        setActivity(await api.recentActivity());
        setSnapshot(await api.syncStatus());
        setConflictCount((await api.scanConflicts().catch(() => [])).length);
        void api.accountUsage().then(setUsage).catch(() => undefined);
      } catch (cause) {
        if (!cancelled) notify(errorMessage(cause), "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  useEffect(() => {
    const timer = setInterval(() => {
      void api
        .syncStatus()
        .then(setSnapshot)
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const refreshUsage = useCallback(async () => {
    try {
      setUsage(await api.accountUsage());
    } catch {
      // Silencioso: o cartão de armazenamento segue com o que já foi lido.
    }
  }, []);

  useEffect(() => {
    // A primeira leitura pode cair no momento em que o rclone está subindo: uma
    // segunda tentativa logo depois evita o cartão vazio por até um minuto.
    const primeira = setTimeout(() => void refreshUsage(), 3000);
    const timer = setInterval(() => void refreshUsage(), 30_000);
    return () => {
      clearTimeout(primeira);
      clearInterval(timer);
    };
  }, [refreshUsage]);

  useEffect(() => {
    if (!isDesktop || !settings.notifications) return;
    void (async () => {
      try {
        if (!(await isPermissionGranted())) await requestPermission();
      } catch {
        // Sem permissão: o app segue funcionando, apenas sem avisos.
      }
    })();
  }, [settings.notifications]);

  // Mantém a versão mais recente de syncAll acessível ao listener da bandeja sem
  // reassinar o evento a cada mudança de estado.
  const syncAllRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const disposers = [
      subscribe("sync://snapshot", (payload) => setSnapshot(payload as Snapshot)),
      subscribe("sync://changed", () => {
        void refreshProfiles();
        void refreshActivity();
        void api.listAccounts().then(setAccounts).catch(() => undefined);
      }),
      subscribe("settings://changed", () => {
        void api.getSettings().then((value) => setSettings({ ...DEFAULT_SETTINGS, ...value }));
      }),
      // “Sincronizar agora” pela bandeja: mostra a visão geral e dispara as pastas.
      subscribe("ui://sync-all", () => {
        setView("dashboard");
        void syncAllRef.current?.();
      }),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, [refreshActivity, refreshProfiles]);

  const syncAll = useCallback(async () => {
    if (snapshot.paused) {
      try {
        setSnapshot(await api.setPaused(false));
        notify("Sincronização retomada.", "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
      }
      return;
    }
    const targets = profiles.filter((profile) => profile.enabled);
    if (targets.length === 0) {
      notify("Adicione uma pasta antes de sincronizar.", "info");
      return;
    }
    const results = await Promise.allSettled(
      targets.map((profile) => api.startSync(profile.id, profile.resyncNeeded)),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure && failure.status === "rejected") {
      notify(errorMessage(failure.reason), "error");
    } else {
      notify("Sincronização iniciada.", "ok");
    }
  }, [notify, profiles, snapshot.paused]);

  useEffect(() => {
    syncAllRef.current = syncAll;
  }, [syncAll]);

  const togglePause = useCallback(async () => {
    try {
      setSnapshot(await api.setPaused(!snapshot.paused));
      notify(snapshot.paused ? "Sincronização retomada." : "Sincronização pausada.", "ok");
    } catch (cause) {
      notify(errorMessage(cause), "error");
    }
  }, [notify, snapshot.paused]);

  const syncProfile = useCallback(
    async (id: string, resync = false) => {
      try {
        setSnapshot(await api.startSync(id, resync));
        notify("Sincronização iniciada.", "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
      }
    },
    [notify],
  );

  const updateProfile = useCallback(
    async (profile: Profile) => {
      try {
        const updated = await api.updateProfile(profile);
        setProfiles((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        notify(updated.enabled ? "Pasta ativada." : "Pasta desativada.", "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
      }
    },
    [notify],
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      try {
        await api.deleteProfile(id);
        await refreshProfiles();
        notify("Pasta removida.", "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
      }
    },
    [notify, refreshProfiles],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        void api.saveSettings(next).catch((cause) => notify(errorMessage(cause), "error"));
        return next;
      });
    },
    [notify],
  );

  const changeAutostart = useCallback(
    async (enabled: boolean) => {
      setAutostartBusy(true);
      try {
        // A resposta é o estado final do sistema, que pode não ser o pedido
        // (dentro do Flatpak quem escreve o arquivo é o portal).
        const value = await api.setAutostart(enabled);
        setAutostart(value);
        notify(value ? "Nuvem abrirá junto com o sistema." : "Início automático desativado.", "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
        setAutostart(await api.autostartEnabled().catch(() => enabled));
      } finally {
        setAutostartBusy(false);
      }
    },
    [notify],
  );

  const removeAccount = useCallback(
    async (name: string) => {
      try {
        await api.deleteAccount(name);
        const lista = await api.listAccounts();
        setAccounts(lista);
        setFilesAccount((atual) =>
          lista.some((item) => item.name === atual) ? atual : lista[0]?.name ?? "",
        );
        void api.accountUsage().then(setUsage).catch(() => undefined);
        notify(`Conta “${name}” removida.`, "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
      }
    },
    [notify],
  );

  const addAccount = useCallback(
    async (provider: string, name: string) => {
      const account = await api.connectAccount(provider, name);
      setAccounts(await api.listAccounts());
      setFilesAccount(account.name);
      setFilesPath("");
      notify(`Conta “${account.name}” conectada.`, "ok");
    },
    [notify],
  );

  const addFolder = useCallback(
    async (input: { account: string; remotePath: string; localPath: string }) => {
      const profile = await api.createProfile({ ...input, enabled: true });
      setProfiles((items) => [...items, profile]);
      notify("Pasta adicionada. Sincronizando pela primeira vez…", "ok");
      void syncProfile(profile.id, true);
    },
    [notify, syncProfile],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      const views: ViewId[] = [
        "dashboard",
        "files",
        "folders",
        "activity",
        "conflicts",
        "settings",
      ];
      const index = Number(event.key) - 1;
      if (index >= 0 && index < views.length) {
        event.preventDefault();
        setView(views[index]);
      }
      if (event.key === "/") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const paletteActions = useMemo<PaletteAction[]>(() => {
    const nav: PaletteAction[] = (
      [
        ["dashboard", "Visão geral", "dashboard", "1"],
        ["files", "Arquivos", "folder", "2"],
        ["folders", "Pastas", "layers", "3"],
        ["activity", "Atividade", "activity", "4"],
        ["conflicts", "Conflitos", "conflict", "5"],
        ["settings", "Ajustes", "settings", "6"],
      ] as [ViewId, string, IconName, string][]
    ).map(([id, label, icon, shortcut]) => ({
      id: `go-${id}`,
      label,
      group: "Ir para",
      icon,
      shortcut,
      run: () => setView(id),
    }));

    const actions: PaletteAction[] = [
      {
        id: "sync",
        label: "Sincronizar agora",
        group: "Sincronização",
        icon: "refresh",
        run: () => void syncAll(),
      },
      {
        id: "pause",
        label: snapshot.paused ? "Retomar sincronização" : "Pausar tudo",
        group: "Sincronização",
        icon: snapshot.paused ? "play" : "pause",
        run: () => void togglePause(),
      },
      {
        id: "add-folder",
        label: "Adicionar pasta",
        group: "Sincronização",
        icon: "plus",
        run: () => setAddFolderOpen(true),
      },
      {
        id: "add-account",
        label: "Conectar conta",
        group: "Sincronização",
        icon: "link",
        run: () => setAddAccountOpen(true),
      },
      {
        id: "theme",
        label: theme === "light" ? "Ativar tema escuro" : "Ativar tema claro",
        group: "Sistema",
        icon: theme === "light" ? "moon" : "sun",
        run: () => setTheme(theme === "light" ? "dark" : "light"),
      },
      {
        id: "quit",
        label: "Sair do Nuvem",
        group: "Sistema",
        icon: "x",
        run: () => void api.quitApp(),
      },
    ];

    return [...nav, ...actions];
  }, [snapshot.paused, syncAll, theme, togglePause]);

  const meta = TITLES[view];

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={setView}
        folderCount={profiles.length}
        conflictCount={conflictCount}
        engine={engine}
      />

      <div className="main">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          snapshot={snapshot}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          onOpenPalette={() => setPaletteOpen(true)}
          onStatusClick={() => setView("dashboard")}
        />

        <main className="content">
          {view === "dashboard" ? (
            <Dashboard
              snapshot={snapshot}
              accounts={accounts}
              profiles={profiles}
              activity={activity}
              usage={usage}
              onRefreshUsage={() => void refreshUsage()}
              onSyncAll={() => void syncAll()}
              onTogglePause={() => void togglePause()}
              onAddAccount={() => setAddAccountOpen(true)}
              onOpenActivity={() => setView("activity")}
              onOpenFolders={() => setView("folders")}
              onSyncProfile={(id) => void syncProfile(id)}
              onDeleteAccount={removeAccount}
            />
          ) : null}

          {view === "files" ? (
            <Files
              accounts={accounts}
              account={filesAccount}
              path={filesPath}
              onAccount={setFilesAccount}
              onPath={setFilesPath}
              onAddAccount={() => setAddAccountOpen(true)}
              notify={notify}
            />
          ) : null}

          {view === "folders" ? (
            <Folders
              profiles={profiles}
              accounts={accounts}
              onAddFolder={() => setAddFolderOpen(true)}
              onUpdate={(profile) => void updateProfile(profile)}
              onDelete={(id) => void deleteProfile(id)}
              onSync={(id, resync) => void syncProfile(id, resync)}
              notify={notify}
            />
          ) : null}

          {view === "activity" ? <Activity entries={activity} onClear={clearActivity} /> : null}

          {view === "conflicts" ? <Conflicts notify={notify} /> : null}

          {view === "settings" ? (
            <SettingsView
              settings={settings}
              theme={theme}
              engine={engine}
              accounts={accounts}
              autostart={autostart}
              autostartBusy={autostartBusy}
              onUpdate={updateSettings}
              onTheme={setTheme}
              onAutostart={(enabled) => void changeAutostart(enabled)}
              onAddAccount={() => setAddAccountOpen(true)}
              notify={notify}
            />
          ) : null}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        actions={paletteActions}
      />

      {addAccountOpen ? (
        <AddAccountModal
          onClose={() => setAddAccountOpen(false)}
          onConnect={addAccount}
        />
      ) : null}

      {addFolderOpen ? (
        <AddFolderModal
          accounts={accounts}
          defaultAccount={filesAccount}
          onClose={() => setAddFolderOpen(false)}
          onCreate={addFolder}
          notify={notify}
        />
      ) : null}

      <Toasts items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function AddAccountModal({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (provider: string, name: string) => Promise<void>;
}) {
  const [provider, setProvider] = useState("drive");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConnect(provider, name);
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Conectar conta"
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="btn primary" onClick={() => void submit()} disabled={busy}>
            {busy ? <Icon name="refresh" size={15} className="spin" /> : <Icon name="link" size={15} />}
            {busy ? "Aguardando autorização…" : "Conectar"}
          </button>
        </>
      }
    >
      <div className="provider-picker">
        <button
          className={`provider-option ${provider === "drive" ? "selected" : ""}`}
          onClick={() => setProvider("drive")}
          disabled={busy}
        >
          <span className="provider drive" style={{ width: 30, height: 30 }}>
            <Icon name="drive" size={16} />
          </span>
          Google Drive
        </button>
        <button
          className={`provider-option ${provider === "onedrive" ? "selected" : ""}`}
          onClick={() => setProvider("onedrive")}
          disabled={busy}
        >
          <span className="provider onedrive" style={{ width: 30, height: 30 }}>
            <Icon name="onedrive" size={16} />
          </span>
          OneDrive
        </button>
      </div>

      <div className="field">
        <label htmlFor="account-name">Nome da conta (opcional)</label>
        <input
          id="account-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={provider === "drive" ? "Google Drive" : "OneDrive"}
          disabled={busy}
        />
        <span className="hint">
          É o nome que aparece no Nuvem e no rclone. Pode ser qualquer apelido.
        </span>
      </div>

      <div className="banner info">
        <Icon name="shield" size={16} />
        A autorização acontece no navegador. O Nuvem nunca vê sua senha.
      </div>

      {error ? (
        <div className="banner danger">
          <Icon name="alert" size={16} />
          {error}
        </div>
      ) : null}

      {busy ? (
        <p className="muted" style={{ fontSize: 12 }}>
          Termine a autorização na janela do navegador que o rclone abriu. Esta caixa
          fecha sozinha ao concluir.
        </p>
      ) : null}
    </Modal>
  );
}

function AddFolderModal({
  accounts,
  defaultAccount,
  onClose,
  onCreate,
  notify,
}: {
  accounts: Account[];
  defaultAccount?: string;
  onClose: () => void;
  onCreate: (input: { account: string; remotePath: string; localPath: string }) => Promise<void>;
  notify: (message: string, kind?: ToastKind) => void;
}) {
  const inicial = accounts.some((item) => item.name === defaultAccount)
    ? (defaultAccount as string)
    : accounts[0]?.name ?? "";
  const [account, setAccount] = useState(inicial);
  const [remotePath, setRemotePath] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navegador de pastas da nuvem: mostra as subpastas da conta para escolher
  // em vez de exigir o caminho digitado de memória.
  const [browse, setBrowse] = useState("");
  const [folders, setFolders] = useState<RemoteEntry[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    let cancelado = false;
    setLoadingFolders(true);
    setFoldersError(null);
    api
      .listRemote(account, browse)
      .then((listing) => {
        if (cancelado) return;
        setFolders(
          listing
            .filter((entry) => entry.isDir)
            .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
        );
      })
      .catch((cause) => {
        if (cancelado) return;
        setFolders([]);
        setFoldersError(errorMessage(cause));
      })
      .finally(() => {
        if (!cancelado) setLoadingFolders(false);
      });
    return () => {
      cancelado = true;
    };
  }, [account, browse]);

  const trilha = browse.split("/").filter(Boolean);
  const atual = trilha[trilha.length - 1] ?? "";

  const pickFolder = async () => {
    if (!isDesktop) {
      notify("No navegador, digite o caminho manualmente.", "info");
      return;
    }
    try {
      const picked = await openDialog({
        directory: true,
        multiple: false,
        title: "Escolha a pasta local",
      });
      if (typeof picked === "string") setLocalPath(picked);
    } catch (cause) {
      notify(errorMessage(cause), "error");
    }
  };

  const submit = async () => {
    if (!account) {
      setError("Conecte uma conta primeiro.");
      return;
    }
    if (!localPath.trim()) {
      setError("Escolha a pasta local.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        account,
        remotePath: remotePath.trim().replace(/^\/+|\/+$/g, ""),
        localPath: localPath.trim(),
      });
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Adicionar pasta"
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="btn primary" onClick={() => void submit()} disabled={busy}>
            {busy ? <Icon name="refresh" size={15} className="spin" /> : <Icon name="plus" size={15} />}
            Adicionar
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="folder-account">Conta</label>
        <select
          id="folder-account"
          className="select"
          value={account}
          onChange={(event) => {
            setAccount(event.target.value);
            setBrowse("");
            setFolders([]);
          }}
          disabled={busy}
        >
          {accounts.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} · {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="folder-remote">Pasta na nuvem</label>
        <input
          id="folder-remote"
          className="input"
          value={remotePath}
          onChange={(event) => setRemotePath(event.target.value)}
          placeholder="Projetos (vazio = raiz da conta)"
          disabled={busy}
        />
        <span className="hint">
          Escolha na lista ou digite o caminho (vazio = raiz da conta).
        </span>

        <div className="remote-pick">
          <div className="remote-pick-head">
            <button
              className="icon-btn"
              onClick={() => setBrowse(parentPath(browse))}
              disabled={!browse || busy}
              aria-label="Subir um nível"
              title="Subir um nível"
            >
              <Icon name="chevron-left" size={15} />
            </button>
            <span className="remote-trail">
              <button onClick={() => setBrowse("")} className={browse ? "" : "current"}>
                Início
              </button>
              {trilha.map((segmento, indice) => {
                const alvo = trilha.slice(0, indice + 1).join("/");
                const ultimo = indice === trilha.length - 1;
                return (
                  <span className="remote-seg" key={alvo}>
                    <Icon name="chevron-right" size={12} />
                    <button
                      onClick={() => setBrowse(alvo)}
                      className={ultimo ? "current" : ""}
                    >
                      {segmento}
                    </button>
                  </span>
                );
              })}
            </span>
            <span style={{ flex: 1 }} />
            <button
              className="link"
              onClick={() => setRemotePath(browse)}
              disabled={busy}
              title={browse ? `Usar ${browse}` : "Usar a raiz da conta"}
            >
              {browse ? `Usar “${atual}”` : "Usar a raiz"}
            </button>
          </div>
          <div className="remote-list">
            {loadingFolders ? (
              <div className="remote-empty">Lendo a nuvem…</div>
            ) : foldersError ? (
              <div className="remote-empty">{foldersError}</div>
            ) : folders.length === 0 ? (
              <div className="remote-empty">Nenhuma subpasta aqui.</div>
            ) : (
              folders.map((pasta) => (
                <div
                  className={`remote-item ${remotePath === pasta.path ? "selected" : ""}`}
                  key={pasta.path}
                >
                  <button
                    className="remote-name"
                    onClick={() => setRemotePath(pasta.path)}
                    title={`Usar ${pasta.path}`}
                  >
                    <Icon name="folder" size={15} />
                    {pasta.name}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => setBrowse(pasta.path)}
                    aria-label={`Entrar em ${pasta.name}`}
                    title="Entrar"
                  >
                    <Icon name="chevron-right" size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="folder-local">Pasta local</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="folder-local"
            className="input"
            value={localPath}
            onChange={(event) => setLocalPath(event.target.value)}
            placeholder="/home/você/Nuvem/Projetos"
            disabled={busy}
          />
          <button className="btn ghost" onClick={() => void pickFolder()} disabled={busy}>
            <Icon name="folder-open" size={15} />
            Escolher
          </button>
        </div>
        <span className="hint">A pasta é criada se não existir.</span>
      </div>

      {error ? (
        <div className="banner danger">
          <Icon name="alert" size={16} />
          {error}
        </div>
      ) : null}
    </Modal>
  );
}
