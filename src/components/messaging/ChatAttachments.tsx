import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2, FileImage, Film } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];

export interface StagedFile {
  file: File;
  preview: string;
  isVideo: boolean;
}

interface AttachmentButtonProps {
  stagedFiles: StagedFile[];
  setStagedFiles: React.Dispatch<React.SetStateAction<StagedFile[]>>;
  disabled?: boolean;
}

export const AttachmentButton = ({ stagedFiles, setStagedFiles, disabled }: AttachmentButtonProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: "Unsupported file type", description: "Only images (PNG, JPG, WebP, GIF) and videos (MP4, WebM) are allowed.", variant: "destructive" });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds the 5MB limit.`, variant: "destructive" });
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      const preview = URL.createObjectURL(file);
      setStagedFiles(prev => [...prev, { file, preview, isVideo }]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input ref={fileRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple className="hidden" onChange={handleFiles} />
      <Button type="button" size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={disabled} title="Attach image or video">
        <Paperclip className="h-4 w-4" />
      </Button>
    </>
  );
};

export const StagedFilePreview = ({ stagedFiles, setStagedFiles }: { stagedFiles: StagedFile[]; setStagedFiles: React.Dispatch<React.SetStateAction<StagedFile[]>> }) => {
  if (stagedFiles.length === 0) return null;

  const remove = (idx: number) => {
    setStagedFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div className="flex gap-2 px-3 pt-2 overflow-x-auto">
      {stagedFiles.map((f, i) => (
        <div key={i} className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden border bg-muted">
          {f.isVideo ? (
            <div className="flex items-center justify-center h-full"><Film className="h-6 w-6 text-muted-foreground" /></div>
          ) : (
            <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
          )}
          <button onClick={() => remove(i)} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export async function uploadAttachments(
  stagedFiles: StagedFile[],
  messageId: string,
  userId: string,
): Promise<void> {
  for (const sf of stagedFiles) {
    const ext = sf.file.name.split(".").pop() || "bin";
    const storagePath = `${userId}/${messageId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("chat-attachments")
      .upload(storagePath, sf.file, { contentType: sf.file.type });

    if (uploadErr) {
      console.error("Attachment upload error:", uploadErr);
      continue;
    }

    await supabase.from("message_attachments").insert({
      message_id: messageId,
      file_url: storagePath,
      file_name: sf.file.name,
      file_type: sf.file.type,
      file_size: sf.file.size,
    });

    URL.revokeObjectURL(sf.preview);
  }
}

interface MessageAttachmentsProps {
  messageId: string;
  attachments: { file_url: string; file_name: string; file_type: string }[];
}

export const MessageAttachments = ({ attachments }: MessageAttachmentsProps) => {
  const [urls, setUrls] = useState<Record<string, string>>({});

  const getSignedUrl = async (filePath: string) => {
    if (urls[filePath]) return;
    const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(filePath, 3600);
    if (data?.signedUrl) setUrls(prev => ({ ...prev, [filePath]: data.signedUrl }));
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {attachments.map((a, i) => {
        const isVideo = a.file_type.startsWith("video/");
        const url = urls[a.file_url];

        if (!url) {
          getSignedUrl(a.file_url);
          return (
            <div key={i} className="w-32 h-24 rounded bg-muted flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          );
        }

        if (isVideo) {
          return (
            <video key={i} src={url} controls className="max-w-[200px] max-h-[150px] rounded" />
          );
        }

        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt={a.file_name} className="max-w-[200px] max-h-[150px] rounded object-cover" />
          </a>
        );
      })}
    </div>
  );
};
