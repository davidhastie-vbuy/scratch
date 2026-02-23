import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Download, ImageIcon } from "lucide-react";

interface AttachmentRow {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  message_id: string;
  sender_user_id?: string;
  conversation_job_title?: string;
}

const AdminMessageAttachments = () => {
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAttachments();
  }, []);

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from("message_attachments")
      .select("*, messages!inner(sender_user_id, conversation_id, conversations:conversation_id(jobs:job_id(title)))")
      .order("created_at", { ascending: false })
      .limit(100);

    const rows: AttachmentRow[] = (data ?? []).map((a: any) => ({
      id: a.id,
      file_url: a.file_url,
      file_name: a.file_name,
      file_type: a.file_type,
      file_size: a.file_size,
      created_at: a.created_at,
      message_id: a.message_id,
      sender_user_id: a.messages?.sender_user_id,
      conversation_job_title: a.messages?.conversations?.jobs?.title ?? "Unknown job",
    }));

    setAttachments(rows);

    // Pre-fetch signed URLs
    const urls: Record<string, string> = {};
    for (const r of rows) {
      const { data: urlData } = await supabase.storage.from("chat-attachments").createSignedUrl(r.file_url, 3600);
      if (urlData?.signedUrl) urls[r.id] = urlData.signedUrl;
    }
    setSignedUrls(urls);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <ImageIcon className="h-5 w-5" /> Message Attachments
      </h2>
      <p className="text-sm text-muted-foreground">Review images shared in customer–provider conversations for moderation and safety.</p>

      {attachments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No message attachments found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {attachments.map(a => {
            const url = signedUrls[a.id];
            return (
              <Card key={a.id} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {url ? (
                    <img
                      src={url}
                      alt={a.file_name}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightbox(url)}
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs font-medium truncate">{a.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {a.conversation_job_title} • {(a.file_size / 1024).toFixed(0)}KB
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {url && (
                    <a href={url} download={a.file_name} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full mt-1">
                        <Download className="mr-1 h-3 w-3" /> Download
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightbox && <img src={lightbox} alt="Attachment" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessageAttachments;
