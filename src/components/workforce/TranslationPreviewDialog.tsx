import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, ArrowRight, Languages, Loader2 } from "lucide-react";

interface TranslationChange {
  id: string;
  type: "department" | "position" | "jobDescription";
  field: string;
  original: string;
  translated: string;
  accepted: boolean;
}

interface TranslationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: TranslationChange[];
  onApply: (accepted: TranslationChange[]) => Promise<void>;
  fr: boolean;
  isApplying: boolean;
}

export function TranslationPreviewDialog({
  open,
  onOpenChange,
  changes,
  onApply,
  fr,
  isApplying,
}: TranslationPreviewDialogProps) {
  const [localChanges, setLocalChanges] = useState<TranslationChange[]>(changes);

  // Sync when changes prop updates
  if (changes.length > 0 && localChanges.length === 0) {
    setLocalChanges(changes);
  }

  const toggleAccept = (index: number) => {
    setLocalChanges(prev =>
      prev.map((c, i) => (i === index ? { ...c, accepted: !c.accepted } : c))
    );
  };

  const acceptedCount = localChanges.filter(c => c.accepted).length;

  const typeLabel = (type: string) => {
    if (type === "department") return fr ? "Département" : "Department";
    if (type === "position") return fr ? "Poste" : "Position";
    return fr ? "Fiche de poste" : "Job Description";
  };

  const typeBadgeColor = (type: string) => {
    if (type === "department") return "bg-primary/10 text-primary border-primary/20";
    if (type === "position") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  };

  const handleApply = async () => {
    await onApply(localChanges.filter(c => c.accepted));
    setLocalChanges([]);
  };

  const handleClose = (v: boolean) => {
    if (!v) setLocalChanges([]);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {fr ? "Aperçu des traductions" : "Translation Preview"}
          </DialogTitle>
          <DialogDescription>
            {fr
              ? `${localChanges.length} modification(s) détectée(s). Cochez celles à appliquer.`
              : `${localChanges.length} change(s) detected. Check the ones to apply.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh] pr-4">
          <div className="space-y-2">
            {localChanges.map((change, i) => (
              <div
                key={`${change.id}-${change.field}-${i}`}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${change.accepted
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/60 bg-card hover:border-border"
                  }
                `}
                onClick={() => toggleAccept(i)}
              >
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors
                  ${change.accepted
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                  }
                `}>
                  {change.accepted && <Check className="h-3 w-3" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeBadgeColor(change.type)}`}>
                      {typeLabel(change.type)}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">{change.field}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground line-through truncate max-w-[200px]">{change.original}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[200px]">{change.translated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isApplying}>
            {fr ? "Annuler" : "Cancel"}
          </Button>
          <Button
            onClick={handleApply}
            disabled={acceptedCount === 0 || isApplying}
            className="gap-2"
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {fr
              ? `Appliquer ${acceptedCount} modification(s)`
              : `Apply ${acceptedCount} change(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
