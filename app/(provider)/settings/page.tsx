export default function SettingsPage() {
return (
<div className="max-w-xl space-y-4">
<h2 className="text-lg font-semibold">Settings</h2>
<form className="bg-card border border-border rounded-xl2 p-4 space-y-3">
<div className="text-sm font-medium">General</div>
<label className="text-xs text-white/60">Brand name</label>
<input name="brand" defaultValue="Justlife" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
<label className="text-xs text-white/60">Support email</label>
<input name="support" defaultValue="support@example.com" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
<button className="px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm">Save</button>
</form>
</div>
);
}