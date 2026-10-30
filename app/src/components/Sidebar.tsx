import { Icon, type IconName } from "./Icons";
import type { EngineStatus, ViewId } from "../lib/types";
import { isDesktop } from "../lib/bridge";

type NavItem = {
  id: ViewId;
  label: string;
  icon: IconName;
  shortcut: string;
};

const ITEMS: NavItem[] = [
  { id: "dashboard", label: "Visão geral", icon: "dashboard", shortcut: "1" },
  { id: "files", label: "Arquivos", icon: "folder", shortcut: "2" },
  { id: "folders", label: "Pastas", icon: "layers", shortcut: "3" },
  { id: "activity", label: "Atividade", icon: "activity", shortcut: "4" },
  { id: "conflicts", label: "Conflitos", icon: "conflict", shortcut: "5" },
  { id: "settings", label: "Ajustes", icon: "settings", shortcut: "6" },
];

export function Sidebar({
  view,
  onNavigate,
  folderCount,
  conflictCount,
  engine,
}: {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  folderCount: number;
  conflictCount: number;
  engine: EngineStatus | null;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="cloud" size={20} />
        </div>
        <div className="brand-text">
          <div className="brand-name">Nuvem</div>
          <div className="brand-sub">sincronização simples</div>
        </div>
      </div>

      <div className="nav-label">Navegação</div>
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${view === item.id ? "active" : ""}`}
          onClick={() => onNavigate(item.id)}
          title={`${item.label} (${item.shortcut})`}
          aria-current={view === item.id ? "page" : undefined}
        >
          <Icon name={item.icon} size={18} />
          <span>{item.label}</span>
          {item.id === "folders" && folderCount > 0 ? (
            <span className="nav-count">{folderCount}</span>
          ) : null}
          {item.id === "conflicts" && conflictCount > 0 ? (
            <span className="nav-count">{conflictCount}</span>
          ) : null}
        </button>
      ))}

      <div className="sidebar-foot">
        {isDesktop ? (
          <>
            <div className="sidebar-card">
              <strong>{engine?.available ? "rclone conectado" : "Motor indisponível"}</strong>
              {engine?.available
                ? (engine.version ?? "versão desconhecida")
                : "Instale o rclone para sincronizar de verdade."}
            </div>
            <div className="sidebar-card">
              <strong>Sincroniza na bandeja</strong>
              Fechar a janela não interrompe as pastas.
            </div>
          </>
        ) : (
          <div className="sidebar-card">
            <strong>Modo demonstração</strong>
            Dados simulados, sem rclone nem contas reais.
          </div>
        )}
      </div>
    </aside>
  );
}
