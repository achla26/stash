"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}

export function FormDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className={`flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg ${className ?? ""}`}>
        {/* Fixed Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Scroll only content */}
        <div className="flex-1 overflow-y-auto app-scrollbar px-6 py-4">
          {children}
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}