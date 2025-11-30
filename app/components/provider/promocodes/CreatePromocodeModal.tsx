// src/app/provider/promocodes/CreatePromocodeModal.tsx
"use client";

import { useState } from "react";
import {
  createProviderPromocode,
  type DiscountType,
} from "@/app/services/providerPromocodes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CreatePromocodeModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [discountType, setDiscountType] =
    useState<DiscountType>("percentage");
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("AED");
  const [maxUsage, setMaxUsage] = useState<number | "">("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCode("");
    setDescription("");
    setServiceId("");
    setDiscountType("percentage");
    setAmount("");
    setCurrency("AED");
    setMaxUsage("");
    setStartsAt("");
    setEndsAt("");
    setError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Promocode is required.");
      return;
    }
    if (!serviceId.trim()) {
      setError("Service ID is required.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);

      await createProviderPromocode({
        code: code.trim(),
        description: description.trim() || undefined,
        serviceId: serviceId.trim(),
        discountType,
        amount: Number(amount),
        currency: currency.trim() || undefined,
        maxUsage:
          maxUsage && Number(maxUsage) > 0
            ? Number(maxUsage)
            : undefined,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
      });

      resetForm();
      onCreated?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Create promocode error:", err);
      setError(err.message || "Failed to create promocode");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="
          max-w-lg 
          max-h-[90vh] 
          overflow-y-auto 
          p-0
        "
      >
        {/* Inner wrapper so padding scroll ke andar rahe */}
        <div className="p-6 space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Create New Promocode</DialogTitle>
            <DialogDescription>
              Set up a discount code for one of your services. You can
              configure percentage or fixed amount discounts, usage limits,
              and validity dates.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 pt-2"
          >
            {/* Code */}
            <div className="space-y-1">
              <Label htmlFor="promo-code">Promocode</Label>
              <Input
                id="promo-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase())
                }
                placeholder="e.g. SAVE10"
              />
            </div>

            {/* Service ID */}
            <div className="space-y-1">
              <Label htmlFor="service-id">Service ID</Label>
              <Input
                id="service-id"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="Target service ID"
              />
              <p className="text-xs text-muted-foreground">
                Link this promo to a specific service. Later you can
                replace this with a dropdown of your services.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="promo-description">Description</Label>
              <Textarea
                id="promo-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short internal description (optional)"
                rows={2}
              />
            </div>

            {/* Discount row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="discount-type">Discount Type</Label>
                <select
                  id="discount-type"
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as DiscountType)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )
                  }
                  placeholder={
                    discountType === "percentage" ? "10" : "20"
                  }
                />
              </div>
            </div>

            {/* Currency + max usage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="currency">Currency (for fixed)</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="AED"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="max-usage">
                  Max usage (optional)
                </Label>
                <Input
                  id="max-usage"
                  type="number"
                  min={0}
                  value={maxUsage}
                  onChange={(e) =>
                    setMaxUsage(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startsAt">Starts at</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) =>
                    setStartsAt(e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endsAt">Ends at</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) =>
                    setEndsAt(e.target.value)
                  }
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Promocode"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
