import { useState } from "react";
import { Icon } from "../components/Icons";
import { Modal } from "../components/Modal";
import { api, errorMessage } from "../lib/bridge";
import { relativeTime } from "../lib/format";
import type { Account, Profile } from "../lib/types";

export function Folders({
  profiles,
  accounts,
  onAddFolder,
  onUpdate,
  onDelete,
  onSync,
  notify,
}: {
  profiles: Profile[];
  accounts: Account[];
  onAddFolder: () => void;
  onUpdate: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onSync: (id: string, resync?: boolean) => void;
  notify: (message: string, kind?: "info" | "ok" | "error") => void;
}) {
  const [confirming, setConfirming] = useState<Profile | null>(null);

  return (
    <div>
      <div className="toolbar">
        <div>
          <strong style={{ fontSize: 13.5 }}>Pastas sincronizadas</strong>
          <div className="muted" style={{ fontSize: 12 }}>
            Cada pasta liga uma pasta da nuvem a uma pasta local.
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={onAddFolder} disabled={accounts.length === 0}>
          <Icon name="plus" size={16} />
          Adicionar pasta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="banner info" style={{ marginBottom: 14 }}>
          <Icon name="info" size={16} />
          Conecte uma conta antes de escolher pastas.
        </div>
      ) : null}

      <section className="card" style={{ overflow: "hidden" }}>
        {profiles.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Icon name="layers" size={28} />
            </div>
            <h3>Nenhuma pasta ainda</h3>
            <p>
              Escolha uma pasta na nuvem e uma pasta local. O Nuvem mantém as duas
              iguais, nos dois sentidos.
            </p>
            <button className="btn primary" onClick={onAddFolder} disabled={accounts.length === 0}>
              <Icon name="plus" size={16} />
              Adicionar pasta
            </button>
          </div>
        ) : (
          profiles.map((profile) => {
            const provider =
              accounts.find((account) => account.name === profile.account)?.provider ?? "other";
            return (
            <div className="folder-row" key={profile.id}>
              <div className="folder-name">
                <div
                  className={`provider ${provider}`}
                  style={{ width: 34, height: 34, borderRadius: 10 }}
                >
                  <Icon name={provider === "onedrive" ? "onedrive" : "drive"} size={17} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong title={`${profile.account}:${profile.remotePath}`}>
                    {profile.remotePath || "Raiz da conta"}
                  </strong>
                  <div className="folder-path" title={profile.localPath}>
                    {profile.account} → {profile.localPath}
                  </div>
                </div>
              </div>

              <div className="folder-state">
                {profile.lastError ? (
                  <span className="badge danger" title={profile.lastError}>
                    <Icon name="alert" size={12} />
                    {profile.lastError}
                  </span>
                ) : !profile.enabled ? (
                  <span className="badge muted">desativada</span>
                ) : profile.resyncNeeded ? (
                  <span className="badge warn">precisa ressincronizar</span>
                ) : (
                  <span className="badge ok">
                    <Icon name="check" size={12} />
                    em dia · {relativeTime(profile.lastSync)}
                  </span>
                )}
              </div>

              <div className="folder-actions">
                <button
                  className="tiny-btn"
                  title="Abrir pasta local"
                  aria-label={`Abrir ${profile.localPath}`}
                  onClick={() => {
                    void api
                      .revealPath(profile.localPath)
                      .catch((cause) => notify(errorMessage(cause), "error"));
                  }}
                >
                  <Icon name="folder-open" size={15} />
                </button>
                <button
                  className="tiny-btn"
                  title="Sincronizar agora"
                  aria-label={`Sincronizar ${profile.remotePath}`}
                  disabled={!profile.enabled}
                  onClick={() => onSync(profile.id, profile.resyncNeeded)}
                >
                  <Icon name="refresh" size={15} />
                </button>
                <button
                  className={`switch ${profile.enabled ? "on" : ""}`}
                  role="switch"
                  aria-checked={profile.enabled}
                  title={profile.enabled ? "Desativar" : "Ativar"}
                  aria-label={profile.enabled ? "Desativar pasta" : "Ativar pasta"}
                  onClick={() => onUpdate({ ...profile, enabled: !profile.enabled })}
                />
                <button
                  className="tiny-btn"
                  title="Remover"
                  aria-label={`Remover ${profile.remotePath}`}
                  onClick={() => setConfirming(profile)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            );
          })
        )}
      </section>

      <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
        O modo <strong>bisync</strong> compara os dois lados e propaga as mudanças. Ao
        alterar caminhos, a próxima execução faz uma ressincronização completa.
      </p>

      {confirming ? (
        <Modal
          title="Remover pasta?"
          onClose={() => setConfirming(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirming(null)}>
                Cancelar
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  onDelete(confirming.id);
                  setConfirming(null);
                }}
              >
                Remover
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
            A pasta local <strong>{confirming.localPath}</strong> não será apagada nem
            enviada. Apenas o par de sincronização sai do Nuvem.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
