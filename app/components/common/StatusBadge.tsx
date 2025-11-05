export function StatusBadge({ status }: { status: "pending" | "confirmed" | "assigned" | "completed" | "cancelled" }) {
const map = {
pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
assigned: "bg-purple-500/15 text-purple-400 border-purple-500/20",
completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/20",
} as const;
return <span className={`px-2 py-0.5 rounded border text-xs ${map[status]}`}>{status}</span>;
}