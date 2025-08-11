import { ClickableListItem } from "./clickable-list-item";
import { EmptyState } from "./empty-state";

interface User {
  username: string;
  timestamp: number;
  href: string;
}

interface UserListProps {
  users: User[];
  emptyMessage: string;
  maxHeight?: string;
  showTimestamp?: boolean;
  maxItems?: number;
}

export function UserList({ 
  users, 
  emptyMessage, 
  maxHeight = "max-h-[400px]",
  showTimestamp = true,
  maxItems = 20
}: UserListProps) {
  if (users.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
      {users.slice(0, maxItems).map((user, i) => (
        <ClickableListItem key={i} href={user.href}>
          <span className="text-sm">{user.username}</span>
          {showTimestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(user.timestamp * 1000).toLocaleDateString()}
            </span>
          )}
        </ClickableListItem>
      ))}
    </div>
  );
}