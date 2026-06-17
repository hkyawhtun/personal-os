/* ============================================================
   Toasts — announce assistant (agent) actions globally, so a change
   it makes to app state is obvious wherever you are.
   ============================================================ */
import { Icon } from "../components/icons";

export interface Toast {
  id: string;
  text: string;
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-icon">
            <Icon.spark size={14} />
          </span>
          <span className="toast-text">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
