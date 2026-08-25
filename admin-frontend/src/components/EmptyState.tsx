type Props = { title: string; detail: string; action?: React.ReactNode };
export function EmptyState({ title, detail, action }: Props) {
  return <div className="empty-state"><span>○</span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
