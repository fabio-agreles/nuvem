import { Icon } from "./Icons";
import type { Snapshot } from "../lib/types";

function statusOf(snapshot: Snapshot) {
  if (snapshot.paused) return { tone: "warn", label: "Pausado" };
  if (snapshot.running) {
    const count = snapshot.jobs;
    return {
      tone: "busy",
      label: count === 1 ? "Sincronizando 1 tarefa" : `Sincronizando ${count} tarefas`,
    };
  }
  return { tone: "ok", label: "Tudo em dia" };
}

export function TopBar({
  title,
  subtitle,
  snapshot,
  theme,
  onToggleTheme,
  onOpenPalette,
  onStatusClick,
}: {
  title: string;
  subtitle: string;
  snapshot: Snapshot;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenPalette: () => void;
  onStatusClick: () => void;
}) {
  const status = statusOf(snapshot);

  return (
    <header className="topbar">
      <div className="topbar-titles">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <button className="pill" onClick={onStatusClick} title="Abrir visão geral">
          <span className={`dot ${status.tone}`} />
          {status.label}
        </button>

        <button className="search-btn" onClick={onOpenPalette} aria-label="Abrir busca de ações">
          <Icon name="search" size={15} />
          <span>Buscar</span>
          <span className="kbd">Ctrl K</span>
        </button>

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
          title={theme === "light" ? "Tema escuro" : "Tema claro"}
        >
          <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
        </button>

        <div className="avatar" aria-label="Perfil local">
          N
        </div>
      </div>
    </header>
  );
}
