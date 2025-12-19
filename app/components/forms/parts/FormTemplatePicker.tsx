"use client";

export default function FormTemplatePicker({ name }: { name: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-white/60">Booking form template</label>
      <select
        name={name}
        defaultValue=""
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">No form attached</option>
        <option value="tmpl_basic_address">Basic Address (name/phone/address)</option>
        <option value="tmpl_sofa_size">Sofa Size Wizard</option>
        <option value="tmpl_deep_clean">Deep Cleaning Questions</option>
      </select>
      <div className="text-[11px] text-white/50">
        Attach a dynamic form shown to customers during booking.
      </div>
    </div>
  );
}
