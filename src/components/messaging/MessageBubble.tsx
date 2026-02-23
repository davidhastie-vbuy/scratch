import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
}

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  attachments: Attachment[];
}

const MessageBubble = ({ message, isOwn, attachments }: MessageBubbleProps) => {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (attachments.length === 0) return;
    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      for (const att of attachments) {
        const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(att.file_url, 3600);
        if (data?.signedUrl) urls[att.id] = data.signedUrl;
      }
      setSignedUrls(urls);
    };
    fetchUrls();
  }, [attachments]);

  return (
    <>
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {attachments.map(att => {
            const url = signedUrls[att.id];
            return url ? (
              <img
                key={att.id}
                src={url}
                alt={att.file_name}
                className="rounded-md max-h-48 max-w-full mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(url)}
              />
            ) : (
              <div key={att.id} className="h-32 w-32 rounded-md bg-muted-foreground/10 animate-pulse mb-1" />
            );
          })}
          {message.body && <p>{message.body}</p>}
          <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightbox && <img src={lightbox} alt="Attachment" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageBubble;
