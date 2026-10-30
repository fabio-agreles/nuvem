import { useState } from "react";
import { Icon } from "../components/Icons";
import { Modal } from "../components/Modal";
import { resumoTexto } from "../lib/files";
import { formatBytes, formatEta, formatSpeed, relativeTime } from "../lib/format";
import type { Account, AccountUsage, ActivityEntry, Profile, Snapshot } from "../lib/types";

function activityIcon(kind: string) {
  switch (kind) {
    case "upload":
      return "upload" as const;
    case "download":
      return "download" as const;
    case "conflict":
      return "conflict" as const;
    case "error":
      return "alert" as const;
    case "account":
      return "link" as const;
    case "sync":
      return "refresh" as const;
    default:
      return "info" as const;
  }
}

export function Dashboard({
  snapshot,
  accounts,
  profiles,
  activity,
  usage,
  onRefreshUsage,
  onSyncAll,
  onTogglePause,
  onAddAccount,
  onOpenActivity,
  onOpenFolders,
  onSyncProfile,
  onDeleteAccount,
}: {
  snapshot: Snapshot;
  accounts: Account[];
  profiles: Profile[];
  activity: ActivityEntry[];
  usage: AccountUsage[];
  onRefreshUsage: () => void;
  onSyncAll: () => void;
  onTogglePause: () => void;
  onAddAccount: () => void;
  onOpenActivity: () => void;
  onOpenFolders: () => void;
  onSyncProfile: (id: string) => void;
  onDeleteAccount: (account: string) => Promise<void>;
}) {
  const enabled = profiles.filter((profile) => profile.enabled);
  const [removendo, setRemovendo] = useState<Account | null>(null);
  const pending = snapshot.transfers.filter((transfer) => transfer.percent < 100);
  const lastSync = profiles
    .map((profile) => profile.lastSync ?? 0)
    .reduce((left, right) => Math.max(left, right), 0);
  const percent =
    snapshot.totalBytes > 0
      ? Math.min(100, Math.round((snapshot.bytes / snapshot.totalBytes) * 100))
      : 0;

  const heroClass = snapshot.paused ? "paused" : snapshot.running ? "" : "idle";
  const title = snapshot.paused
    ? "Sincronização pausada"
    : snapshot.running
      ? "Sincronizando agora"
      : "Tudo em dia";
  const subtitle = snapshot.paused
    ? "Nada foi perdido: retome quando quiser."
    : snapshot.running
      ? `${snapshot.jobs} tarefa${snapshot.jobs === 1 ? "" : "s"} em andamento · ${formatSpeed(snapshot.speed)}`
      : lastSync > 0
        ? `Última verificação ${relativeTime(lastSync)}`
        : "Adicione uma pasta para começar.";

  return (
    <div>
      <section className={`hero ${heroClass}`}>
        <div className="hero-top">
          <div className="hero-icon">
            <Icon name={snapshot.paused ? "pause" : snapshot.running ? "refresh" : "check"} size={22} />
          </div>
          <div>
            <h2>{title}</h2>
            <div className="hero-sub">{subtitle}</div>
          </div>
          <div className="hero-actions">
            {!snapshot.running && !snapshot.paused ? (
              <button className="btn light" onClick={onSyncAll} disabled={enabled.length === 0}>
                <Icon name="refresh" size={16} />
                Sincronizar agora
              </button>
            ) : null}
            <button className="btn on-hero" onClick={onTogglePause}>
              <Icon name={snapshot.paused ? "play" : "pause"} size={15} />
              {snapshot.paused ? "Retomar" : "Pausar tudo"}
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <div>
            <div className="hero-stat-label">Velocidade</div>
            <div className="hero-stat-value">
              {snapshot.running ? formatSpeed(snapshot.speed) : "—"}
            </div>
          </div>
          <div>
            <div className="hero-stat-label">Transferido</div>
            <div className="hero-stat-value">
              {snapshot.running ? formatBytes(snapshot.bytes) : "0 B"}
            </div>
          </div>
          <div>
            <div className="hero-stat-label">Pastas ativas</div>
            <div className="hero-stat-value">
              {enabled.length} de {profiles.length}
            </div>
          </div>
        </div>

        {snapshot.running ? (
          <div className="hero-bar">
            <div className="hero-track">
              <span style={{ width: `${percent}%` }} />
            </div>
            <span className="hero-percent">{percent}%</span>
          </div>
        ) : null}
      </section>

      <div className="dashboard-grid">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Na fila</h2>
              <span className="spacer" />
              {snapshot.running ? (
                <span className="muted" style={{ fontSize: 12 }}>
                  {formatBytes(snapshot.bytes)} de {formatBytes(snapshot.totalBytes)}
                </span>
              ) : null}
            </div>
            <div className="card-body">
              {pending.length === 0 ? (
                <div className="empty" style={{ padding: "26px 12px" }}>
                  <div className="empty-art">
                    <Icon name="check" size={26} />
                  </div>
                  <h3>Nada para transferir</h3>
                  <p>
                    {snapshot.paused
                      ? "A sincronização está pausada."
                      : "Todas as pastas ativas estão atualizadas."}
                  </p>
                  {enabled.length > 0 && !snapshot.running ? (
                    <button className="btn sm ghost" onClick={onSyncAll}>
                      <Icon name="refresh" size={14} />
                      Verificar novamente
                    </button>
                  ) : null}
                </div>
              ) : (
                pending.map((transfer) => (
                  <div className="transfer" key={transfer.name}>
                    <div className="transfer-icon">
                      <Icon name="upload" size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="transfer-name" title={transfer.name}>
                        {transfer.name}
                      </div>
                      <div className="transfer-meta">
                        <span>
                          {formatBytes(transfer.bytes)} de {formatBytes(transfer.size)}
                        </span>
                        <span>·</span>
                        <span>{formatSpeed(transfer.speed)}</span>
                        <span>·</span>
                        <span>faltam {formatEta(transfer.eta)}</span>
                      </div>
                      <div className="progress" style={{ marginTop: 7 }}>
                        <span style={{ width: `${Math.round(transfer.percent)}%` }} />
                      </div>
                    </div>
                    <div className="transfer-percent">{Math.round(transfer.percent)}%</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Atividade recente</h2>
              <span className="spacer" />
              <button className="link" onClick={onOpenActivity}>
                Ver tudo
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 6 }}>
              {activity.length === 0 ? (
                <p className="muted" style={{ fontSize: 12.5, padding: "10px 0" }}>
                  Nada por aqui ainda.
                </p>
              ) : (
                <div className="mini-activity">
                  {activity.slice(0, 4).map((entry) => (
                    <div className="mini-row" key={entry.id}>
                      <div className={`feed-icon ${entry.kind}`} style={{ width: 28, height: 28 }}>
                        <Icon name={activityIcon(entry.kind)} size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="mini-title">{entry.title}</div>
                        <div className="mini-detail">{entry.detail}</div>
                        {entry.files && entry.files.length > 0 ? (
                          <div className="mini-files">{resumoTexto(entry.files)}</div>
                        ) : null}
                      </div>
                      <div className="mini-time">{relativeTime(entry.at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Contas</h2>
              <span className="spacer" />
              <button className="link" onClick={onAddAccount}>
                Adicionar
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <div className="accounts">
                {accounts.map((account) => {
                  const linked = profiles.filter((profile) => profile.account === account.name);
                  const failing = linked.some((profile) => profile.lastError);
                  return (
                    <div className="account" key={account.name}>
                      <div className={`provider ${account.provider}`}>
                        <Icon name={account.provider === "drive" ? "drive" : "onedrive"} size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="account-name">{account.name}</div>
                        <div className="account-meta">
                          {account.label} · {linked.length} pasta{linked.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="account-status">
                        <span className={`dot ${failing ? "danger" : linked.length ? "ok" : ""}`} />
                        {failing ? "atenção" : linked.length ? "conectada" : "sem pasta"}
                      </div>
                      <button
                        className="tiny-btn account-remove"
                        title="Remover conta"
                        aria-label={`Remover a conta ${account.name}`}
                        onClick={() => setRemovendo(account)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  );
                })}
                {accounts.length === 0 ? (
                  <div className="empty" style={{ padding: "20px 8px" }}>
                    <div className="empty-art">
                      <Icon name="cloud" size={24} />
                    </div>
                    <h3>Nenhuma conta ainda</h3>
                    <p>Conecte o Google Drive ou o OneDrive para começar.</p>
                    <button className="btn sm primary" onClick={onAddAccount}>
                      <Icon name="plus" size={14} />
                      Conectar conta
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Armazenamento</h2>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              {usage.length === 0 ? (
                <p className="muted" style={{ fontSize: 12.5, padding: "6px 0" }}>
                  {accounts.length === 0
                    ? "Conecte uma conta para ver a cota."
                    : "Lendo a cota…"}
                </p>
              ) : (
                usage.map((item) => {
                  const percent =
                    item.total && item.used
                      ? Math.min(100, Math.round((item.used / item.total) * 100))
                      : 0;
                  const temNumeros = item.total !== null && item.used !== null;
                  return (
                    <div className="quota" key={item.account}>
                      <div className="quota-head">
                        <span className="quota-name">{item.account}</span>
                        <span className="quota-value">
                          {temNumeros
                            ? `${formatBytes(item.used!)} de ${formatBytes(item.total!)}`
                            : item.error
                              ? "não consegui ler agora"
                              : "lendo…"}
                        </span>
                      </div>
                      <div className="progress" style={{ marginTop: 6 }}>
                        <span style={{ width: `${percent}%` }} />
                      </div>
                      <div className="quota-foot">
                        <span>{item.label}</span>
                        {item.error ? (
                          item.stale ? (
                            // A leitura falhou, mas o número anterior continua valendo.
                            <span className="badge warn" title={item.error}>
                              desatualizada
                            </span>
                          ) : (
                            <button className="link" title={item.error} onClick={onRefreshUsage}>
                              tentar de novo
                            </button>
                          )
                        ) : (
                          <span>{percent}% usado</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Pastas</h2>
              <span className="spacer" />
              <button className="link" onClick={onOpenFolders}>
                Gerenciar
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 6 }}>
              {enabled.length === 0 ? (
                <p className="muted" style={{ fontSize: 12.5, padding: "8px 0" }}>
                  Nenhuma pasta ativa.
                </p>
              ) : (
                enabled.slice(0, 5).map((profile) => (
                  <div className="mini-row" key={profile.id}>
                    <div className="file-ico dir" style={{ width: 28, height: 28 }}>
                      <Icon name="folder" size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="mini-title" title={`${profile.account}:${profile.remotePath}`}>
                        {profile.remotePath || profile.account}
                      </div>
                      <div className="mini-detail">{profile.localPath}</div>
                    </div>
                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {profile.lastError ? (
                        <span className="badge danger">erro</span>
                      ) : profile.resyncNeeded ? (
                        <span className="badge warn">ressincronizar</span>
                      ) : (
                        <span className="badge ok">em dia</span>
                      )}
                      <button
                        className="tiny-btn"
                        onClick={() => onSyncProfile(profile.id)}
                        title="Sincronizar esta pasta"
                        aria-label={`Sincronizar ${profile.remotePath}`}
                      >
                        <Icon name="refresh" size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {removendo ? (
        <Modal
          title={`Remover ${removendo.name}?`}
          onClose={() => setRemovendo(null)}
          footer={
            removendo &&
            profiles.some((profile) => profile.account === removendo.name) ? (
              <button
                className="btn primary"
                onClick={() => {
                  setRemovendo(null);
                  onOpenFolders();
                }}
              >
                Abrir Pastas
              </button>
            ) : (
              <>
                <button className="btn ghost" onClick={() => setRemovendo(null)}>
                  Cancelar
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    void onDeleteAccount(removendo.name);
                    setRemovendo(null);
                  }}
                >
                  Remover conta
                </button>
              </>
            )
          }
        >
          <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
            O Nuvem apaga as credenciais desta conta do rclone neste computador. Nada é
            apagado na nuvem nem no disco.
          </p>
          {profiles.some((profile) => profile.account === removendo.name) ? (
            <p style={{ fontSize: 12.5, color: "var(--warn)", marginTop: 10 }}>
              Esta conta ainda tem pasta configurada. Remova a pasta antes para não
              deixar um par de sincronização apontando para uma conta que não existe.
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
              Para voltar depois, é só conectar de novo (o navegador abre para a
              autorização).
            </p>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
