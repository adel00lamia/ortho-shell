import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";

interface EvaluationSectionProps {
  title: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  bgColorClass: string;
  onAISuggest?: () => void;
  aiLoading?: boolean;
  aiDisabled?: boolean;
}

export default function EvaluationSection({
  title,
  items,
  onAdd,
  onRemove,
  placeholder,
  bgColorClass,
  onAISuggest,
  aiLoading,
  aiDisabled
}: EvaluationSectionProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-semibold">{title}</Label>
        {onAISuggest && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAISuggest}
            disabled={aiLoading || aiDisabled}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Suggest
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 group">
            <div className={`flex-1 text-sm p-3 ${bgColorClass} rounded-lg border`}>
              {item}
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => onRemove(idx)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 mt-4">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" onClick={handleAdd} variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { useState } from "react";
