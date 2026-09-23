"use client";

import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PadPrivateStateProps {
  message: string;
  onBack: () => void;
}

export function PadPrivateState({ message, onBack }: PadPrivateStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
        <Lock className="h-8 w-8 text-warning" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Private Pad</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}