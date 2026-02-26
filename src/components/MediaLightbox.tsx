import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MediaLightbox = ({ media, initialIndex = 0, open, onOpenChange }: MediaLightboxProps) => {
  const [index, setIndex] = useState(initialIndex);
  const item = media[index];
  if (!item) return null;

  const prev = () => setIndex(i => (i > 0 ? i - 1 : media.length - 1));
  const next = () => setIndex(i => (i < media.length - 1 ? i + 1 : 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black/95 border-none [&>button]:hidden">
        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[90vh]">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {media.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 z-10 text-white hover:bg-white/20"
                onClick={prev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 z-10 text-white hover:bg-white/20"
                onClick={next}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="flex items-center justify-center w-full h-full p-8">
            {item.type.startsWith("video") ? (
              <video
                key={item.url}
                src={item.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded"
              />
            ) : (
              <img
                src={item.url}
                alt={item.name || "Media"}
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
            )}
          </div>

          {media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs">
              {index + 1} / {media.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;
