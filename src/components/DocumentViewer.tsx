import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  bucket: string;
}

const DocumentViewer = ({ open, onOpenChange, fileUrl, fileName, fileType, bucket }: DocumentViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadSignedUrl = async () => {
    if (signedUrl) return;
    setLoading(true);
    setError(false);
    const { data, error: err } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileUrl, 3600);
    if (err || !data?.signedUrl) {
      setError(true);
    } else {
      setSignedUrl(data.signedUrl);
    }
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadSignedUrl();
    } else {
      setSignedUrl(null);
      setError(false);
    }
    onOpenChange(isOpen);
  };

  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  const handleDownload = async () => {
    if (!signedUrl) return;
    try {
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(signedUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 [&>button]:hidden overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {signedUrl && (
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Loading document…</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-8 text-center">
              <FileText className="h-12 w-12" />
              <p className="text-sm font-medium">Unable to load document</p>
              <p className="text-xs">The document could not be retrieved. Please try again.</p>
            </div>
          )}
          {signedUrl && !loading && !error && (
            <>
              {isImage && (
                <img
                  src={signedUrl}
                  alt={fileName}
                  className="max-w-full max-h-[75vh] object-contain p-4"
                />
              )}
              {isPdf && (
                <iframe
                  src={signedUrl}
                  title={fileName}
                  className="w-full h-[75vh] border-0"
                />
              )}
              {!isImage && !isPdf && (
                <div className="flex flex-col items-center gap-3 text-muted-foreground p-8 text-center">
                  <FileText className="h-12 w-12" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs">This file type cannot be previewed. Use the download button above.</p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Download File
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
