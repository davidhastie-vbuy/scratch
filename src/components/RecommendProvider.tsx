import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, ThumbsUp } from "lucide-react";

const RecommendProvider = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendation, setRecommendation] = useState("");
  const [recPhotos, setRecPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - recPhotos.length);
      setRecPhotos((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setRecPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!recommendation.trim() && recPhotos.length === 0) {
      toast({ title: "Nothing to submit", description: "Please add a message or photo.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, postcode")
        .eq("id", user.id)
        .single();

      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("user_email", user.email || "");
      formData.append("customer_name", `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim());
      formData.append("customer_postcode", profile?.postcode ?? "");
      if (recommendation.trim()) formData.append("message", recommendation.trim());
      recPhotos.forEach((photo) => formData.append("photos", photo));

      const { error } = await supabase.functions.invoke("submit-recommendation", { body: formData });
      if (error) throw error;

      toast({ title: "Thank you!", description: "Your recommendation has been submitted." });
      setRecommendation("");
      setRecPhotos([]);
    } catch (err) {
      console.error("Failed to submit recommendation:", err);
      toast({ title: "Submission failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ThumbsUp className="h-5 w-5 text-primary" />
          Recommend a Provider
        </CardTitle>
        <CardDescription>
          Know a great tradesperson? Tell us about them so we can invite them to join the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2 rounded-xl border border-dashed border-primary/20 bg-accent/30 p-4">
            <Label htmlFor="recommendation" className="text-sm leading-relaxed font-normal text-muted-foreground">
              If you would like to recommend a tradesperson you have hired in the past, please tell us about your experience and the work they completed for you. You can also attach photos. <span className="italic">(Optional)</span>
            </Label>
            <Textarea
              id="recommendation"
              placeholder="e.g. I hired John from ABC Plumbing to fix a leak. He was professional, on time, and did a great job..."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              maxLength={2000}
              className="min-h-[100px]"
            />
            <div className="flex flex-wrap items-center gap-2">
              {recPhotos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${i + 1}`}
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {recPhotos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-primary/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Camera className="h-5 w-5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                className="hidden"
              />
            </div>
            {recPhotos.length > 0 && (
              <p className="text-xs text-muted-foreground">{recPhotos.length}/5 photos attached</p>
            )}
          </div>
          <Button type="submit" className="font-bold" disabled={loading}>
            {loading ? "Submitting..." : "Submit Recommendation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecommendProvider;
