"use client";
import { Bell } from "lucide-react";


export function Topbar() {
return (
<header className="h-16 border-b border-border bg-background/60 backdrop-blur flex items-center px-6 justify-between">
<div className="text-sm text-white/60">Operations · GCC</div>
<div className="flex items-center gap-4">
<button className="relative p-2 rounded-lg hover:bg-card">
<Bell size={18} />
<span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
</button>
<div className="w-8 h-8 rounded-full bg-card border border-border" />
</div>
</header>
);
}