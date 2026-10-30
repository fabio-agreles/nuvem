import { useCallback, useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Icon } from "../components/Icons";
import { api, errorMessage, isDesktop } from "../lib/bridge";
import { formatBytes, joinPath, parentPath } from "../lib/format";
import type { Account, FolderSize, RemoteEntry } from "../lib/types";

export function Files({
  accounts,
  account,
  path,
  onAccount,
  onPath,
  onAddAccount,
  notify,
}: {
  accounts: Account[];
  /// Conta e caminho vivem no App: trocar de aba não pode perder a escolha.
  account: string;
  path: string;
  onAccount: (name: string) => void;
  onPath: (path: string) => void;
  onAddAccount: () => void;
  notify: (message: string, kind?: "info" | "ok" | "error") => void;
}) {
  const [entries, setEntries] = useState<RemoteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<FolderSize | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const listing = await api.listRemote(account, path);
      setEntries(listing);
    } catch (cause) {
      setEntries([]);
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }

    // O tamanho total é uma segunda chamada (operations/size) e pode falhar
    // sozinho — não impede a listagem de aparecer.
    setSize(null);
    try {
      setSize(await api.folderSize(account, path));
    } catch {
      setSize(null);
    }
  }, [account, path]);

  const upload = useCallback(async () => {
    if (!account) return;
    setBusy("upload");
    try {
      if (isDesktop) {
        const picked = await open({
          multiple: true,
          title: "Enviar arquivos para a nuvem",
        });
        const files = Array.isArray(picked) ? picked : picked ? [picked] : [];
        if (files.length === 0) return;
        for (const file of files) {
          await api.uploadFile(account, path, file);
        }
        notify(
          files.length === 1
            ? `Enviado para ${account}:${path || "/"}.`
            : `${files.length} arquivos enviados para ${account}:${path || "/"}.`,
          "ok",
        );
      } else {
        const remote = await api.uploadFile(
          account,
          path,
          `/tmp/demonstracao/arquivo-${Date.now()}.txt`,
        );
        notify(`Demonstração: ${remote} entrou na lista.`, "ok");
      }
      await load();
    } catch (cause) {
      notify(errorMessage(cause), "error");
    } finally {
      setBusy(null);
    }
  }, [account, path, load, notify]);

  const download = useCallback(
    async (entry: RemoteEntry) => {
      if (!account) return;
      setBusy(entry.path);
      try {
        let target = "/tmp/demonstracao";
        if (isDesktop) {
          const picked = await open({
            directory: true,
            title: "Escolha a pasta para baixar",
          });
          if (typeof picked !== "string") return;
          target = picked;
        }
        const saved = await api.downloadFile(account, entry.path, target);
        notify(`Baixado para ${saved}`, "ok");
      } catch (cause) {
        notify(errorMessage(cause), "error");
      } finally {
        setBusy(null);
      }
    },
    [account, notify],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(needle));
  }, [entries, query]);

  const segments = path.split("/").filter(Boolean);

  if (accounts.length === 0) {
    return (
      <section className="card">
        <div className="empty">
          <div className="empty-art">
            <Icon name="cloud" size={28} />
          </div>
          <h3>Conecte uma conta para navegar</h3>
          <p>Seus arquivos aparecem aqui sem precisar baixar nada antes.</p>
          <button className="btn primary" onClick={onAddAccount}>
            <Icon name="plus" size={16} />
            Conectar conta
          </button>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <select
          className="select"
          value={account}
          onChange={(event) => {
            onAccount(event.target.value);
            onPath("");
          }}
          aria-label="Conta"
        >
          {accounts.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} · {item.label}
            </option>
          ))}
        </select>

        <div className="breadcrumb">
          <button
            onClick={() => onPath("")}
            className={segments.length === 0 ? "current" : undefined}
          >
            Início
          </button>
          {segments.map((segment, index) => {
            const target = segments.slice(0, index + 1).join("/");
            const last = index === segments.length - 1;
            return (
              <span key={target} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="chevron-right" size={13} />
                <button
                  onClick={() => onPath(target)}
                  className={last ? "current" : undefined}
                >
                  {segment}
                </button>
              </span>
            );
          })}
        </div>

        <span style={{ flex: 1 }} />

        <label className="search-field">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar nesta pasta"
            aria-label="Filtrar arquivos"
          />
        </label>

        <button
          className="btn primary small"
          onClick={() => void upload()}
          disabled={busy === "upload"}
          title="Enviar arquivos desta pasta do computador"
        >
          <Icon name={busy === "upload" ? "refresh" : "upload"} size={15} className={busy === "upload" ? "spin" : undefined} />
          Enviar
        </button>

        <button
          className="icon-btn"
          onClick={() => void load()}
          title="Atualizar"
          aria-label="Atualizar listagem"
        >
          <Icon name="refresh" size={17} className={loading ? "spin" : undefined} />
        </button>
      </div>

      <div className="files-summary">
        <span>
          <Icon name="cloud" size={14} />
          {account}:{path || "/"}
        </span>
        {size ? (
          <span className="muted">
            {size.count} {size.count === 1 ? "item" : "itens"} · {formatBytes(size.bytes)}
            {size.sizeless > 0
              ? ` · ${size.sizeless} sem tamanho informado`
              : ""}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="banner danger" style={{ marginBottom: 14 }}>
          <Icon name="alert" size={16} />
          {error}
        </div>
      ) : null}

      <section className="card" style={{ overflow: "hidden" }}>
        {loading && entries.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Icon name="refresh" size={26} className="spin" />
            </div>
            <h3>Lendo a nuvem…</h3>
            <p>Listando {account}:{path || "/"}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Icon name={query ? "search" : "folder-open"} size={26} />
            </div>
            <h3>{query ? "Nada encontrado" : "Pasta vazia"}</h3>
            <p>
              {query
                ? `Nenhum item corresponde a “${query}”.`
                : "Esta pasta não tem arquivos na nuvem. Você pode enviar um agora."}
            </p>
          </div>
        ) : (
          <table className="file-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Modificado</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.path}
                  className="file-row"
                  onClick={() => {
                    if (entry.isDir) {
                      onPath(entry.path);
                      setQuery("");
                    }
                  }}
                  tabIndex={entry.isDir ? 0 : -1}
                  onKeyDown={(event) => {
                    if (entry.isDir && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onPath(entry.path);
                      setQuery("");
                    }
                  }}
                >
                  <td>
                    <div className="file-cell">
                      <span className={`file-ico ${entry.isDir ? "dir" : ""}`}>
                        <Icon name={entry.isDir ? "folder" : "file"} size={15} />
                      </span>
                      {entry.name}
                    </div>
                  </td>
                  <td>{entry.isDir ? "—" : formatBytes(entry.size)}</td>
                  <td>
                    {entry.modified
                      ? new Date(entry.modified).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td>
                    <span className="row-actions">
                      {!entry.isDir ? (
                        <button
                          className="tiny-btn"
                          title="Baixar para o computador"
                          aria-label="Baixar arquivo"
                          onClick={(event) => {
                            event.stopPropagation();
                            void download(entry);
                          }}
                        >
                          <Icon
                            name={busy === entry.path ? "refresh" : "download"}
                            size={14}
                            className={busy === entry.path ? "spin" : undefined}
                          />
                        </button>
                      ) : null}
                      <button
                        className="tiny-btn"
                        title={entry.isDir ? "Abrir" : "Copiar caminho"}
                        aria-label={entry.isDir ? "Abrir pasta" : "Copiar caminho"}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (entry.isDir) {
                            onPath(entry.path);
                            setQuery("");
                          } else {
                            void navigator.clipboard
                              ?.writeText(`${account}:${joinPath(path, entry.name)}`)
                              .then(() => notify("Caminho copiado.", "ok"))
                              .catch(() => notify("Não foi possível copiar.", "error"));
                          }
                        }}
                      >
                        <Icon name={entry.isDir ? "chevron-right" : "link"} size={14} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
        Enviar e baixar arquivos avulsos não substitui uma pasta de sincronização:
        para manter tudo igual nos dois lados, crie um par em <strong>Pastas</strong>.
        {path ? (
          <>
            {" "}
            <button
              className="link-btn"
              onClick={() => {
                onPath(parentPath(path));
                setQuery("");
              }}
            >
              Voltar um nível
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}
