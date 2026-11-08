import { useState } from "react";
import { Icon } from "../components/Icons";
import { Modal } from "../components/Modal";
import { api, errorMessage } from "../lib/bridge";
import { relativeTime } from "../lib/format";
import { useT } from "../lib/i18n";
import type { Account, Profile } from "../lib/types";

/// Erros do rclone são longos ("bisync aborted", "a pasta na nuvem está
/// vazia…"). O cartão mostra o começo; o texto inteiro — e a dica de
/// ressincronizar — ficam no tooltip.
function resumoDoErro(texto: string): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > 46 ? `${limpo.slice(0, 44).trimEnd()}…` : limpo;
}

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
  const t = useT();
  const [confirming, setConfirming] = useState<Profile | null>(null);

  return (
    <div>
      <div className="toolbar">
        <div>
          <strong style={{ fontSize: 13.5 }}>{t("Pastas sincronizadas")}</strong>
          <div className="muted" style={{ fontSize: 12 }}>
            {t("Cada pasta liga uma pasta da nuvem a uma pasta local.")}
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={onAddFolder} disabled={accounts.length === 0}>
          <Icon name="plus" size={16} />
          {t("Adicionar pasta")}
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="banner info" style={{ marginBottom: 14 }}>
          <Icon name="info" size={16} />
          {t("Conecte uma conta antes de escolher pastas.")}
        </div>
      ) : null}

      <section className="card" style={{ overflow: "hidden" }}>
        {profiles.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Icon name="layers" size={28} />
            </div>
            <h3>{t("Nenhuma pasta ainda")}</h3>
            <p>
              {t(
                "Escolha uma pasta na nuvem e uma pasta local. O Nuvem Sync mantém as duas iguais, nos dois sentidos.",
              )}
            </p>
            <button className="btn primary" onClick={onAddFolder} disabled={accounts.length === 0}>
              <Icon name="plus" size={16} />
              {t("Adicionar pasta")}
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
                    {profile.remotePath || t("Raiz da conta")}
                  </strong>
                  <div className="folder-path" title={profile.localPath}>
                    {profile.account} → {profile.localPath}
                  </div>
                </div>
              </div>

              <div className="folder-state">
                {profile.lastError ? (
                  // O erro é um botão: é por ele que se pede a ressincronização
                  // (aceitar o estado atual das duas pastas). Sem isso, um aviso
                  // como "a pasta na nuvem está vazia" não teria saída na tela.
                  <button
                    className="badge danger"
                    style={{
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 11,
                      fontWeight: 600,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={`${profile.lastError}\n\n${t("Clique para Ressincronizar: aceita o estado atual das duas pastas e refaz a base de comparação.")}`}
                    aria-label={t("{erro} — Ressincronizar {pasta}", {
                      erro: profile.lastError,
                      pasta: profile.remotePath || profile.account,
                    })}
                    onClick={() => onSync(profile.id, true)}
                  >
                    <Icon name="alert" size={12} />
                    {resumoDoErro(profile.lastError)}
                  </button>
                ) : !profile.enabled ? (
                  <span className="badge muted">{t("desativada")}</span>
                ) : profile.resyncNeeded ? (
                  <span className="badge warn">{t("precisa ressincronizar")}</span>
                ) : (
                  <span className="badge ok">
                    <Icon name="check" size={12} />
                    {t("em dia · {tempo}", { tempo: relativeTime(profile.lastSync) })}
                  </span>
                )}
              </div>

              <div className="folder-actions">
                <button
                  className="tiny-btn"
                  title={t("Abrir pasta local")}
                  aria-label={t("Abrir {caminho}", { caminho: profile.localPath })}
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
                  title={t("Sincronizar agora")}
                  aria-label={t("Sincronizar {pasta}", {
                    pasta: profile.remotePath || profile.account,
                  })}
                  disabled={!profile.enabled}
                  onClick={() => onSync(profile.id, profile.resyncNeeded)}
                >
                  <Icon name="refresh" size={15} />
                </button>
                <button
                  className={`switch ${profile.enabled ? "on" : ""}`}
                  role="switch"
                  aria-checked={profile.enabled}
                  title={profile.enabled ? t("Desativar") : t("Ativar")}
                  aria-label={profile.enabled ? t("Desativar pasta") : t("Ativar pasta")}
                  onClick={() => onUpdate({ ...profile, enabled: !profile.enabled })}
                />
                <button
                  className="tiny-btn"
                  title={t("Remover")}
                  aria-label={t("Remover {pasta}", {
                    pasta: profile.remotePath || profile.account,
                  })}
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
        {t("O modo")} <strong>bisync</strong>{" "}
        {t(
          "compara os dois lados e propaga as mudanças. Ao alterar caminhos, a próxima execução faz uma ressincronização completa.",
        )}
      </p>

      {confirming ? (
        <Modal
          title={t("Remover pasta?")}
          onClose={() => setConfirming(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirming(null)}>
                {t("Cancelar")}
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  onDelete(confirming.id);
                  setConfirming(null);
                }}
              >
                {t("Remover")}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
            {t("A pasta local")} <strong>{confirming.localPath}</strong>{" "}
            {t(
              "não será apagada nem enviada. Apenas o par de sincronização sai do Nuvem Sync.",
            )}
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
