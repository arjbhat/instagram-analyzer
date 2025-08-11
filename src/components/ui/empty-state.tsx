interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className = "text-center py-8" }: EmptyStateProps) {
  return (
    <p className={`text-muted-foreground ${className}`}>
      {message}
    </p>
  );
}