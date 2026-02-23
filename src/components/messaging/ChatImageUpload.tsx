import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface ChatImageUploadProps {
  onFileSelected: (file: File) => void;
  uploading: boolean;
  pendingFile: File | null;
  onClear: () => void;
}

const ChatImageUpload = ({ onFileSelected, uploading, pendingFile, onClear }: ChatImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PNG, JPG, and WebP images are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Images must be under 5MB.", variant: "destructive" });
      return;
    }
    onFileSelected(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-1">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleChange} />
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </Button>
      {pendingFile && (
        <div className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs">
          <span className="truncate max-w-[100px]">{pendingFile.name}</span>
          <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatImageUpload;
