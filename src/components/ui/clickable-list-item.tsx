import { ReactNode } from "react";

interface ClickableListItemProps {
  href: string;
  children: ReactNode;
}

export function ClickableListItem({ href, children }: ClickableListItemProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer transition-colors block"
    >
      {children}
    </a>
  );
}