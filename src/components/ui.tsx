/* ============================================================
   UI PRIMITIVES — Button, IconButton, TagChip
   ============================================================ */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm";
  icon?: ReactNode;
}

export const Button = ({ variant = "secondary", size, icon, children, className = "", ...p }: ButtonProps) => (
  <button className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...p}>
    {icon}
    {children}
  </button>
);

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  active?: boolean;
}

export const IconButton = ({ icon, active, className = "", ...p }: IconButtonProps) => (
  <button className={`btn-icon ${active ? "active" : ""} ${className}`} {...p}>
    {icon}
  </button>
);

interface TagChipProps {
  children: ReactNode;
  dot?: boolean;
  onClick?: () => void;
}

export const TagChip = ({ children, dot, onClick }: TagChipProps) => (
  <button className="tag" onClick={onClick}>
    {dot && <span className="tag-dot" />}
    {children}
  </button>
);
