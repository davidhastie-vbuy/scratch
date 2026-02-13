import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Image as ImageIcon, Save, GripVertical, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  images: PortfolioImage[];
}

interface PortfolioImage {
  id: string;
  file_url: string;
  file_name: string;
  caption: string | null;
  sort_order: number;
}

const ProviderPortfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [publicBio, setPublicBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  // New project dialog
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Image upload target
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("id, status, public_bio")
      .eq("user_id", user!.id)
      .single();

    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);
    setStatus(profile.status as string);
    setPublicBio((profile as any).public_bio ?? "");

    const { data: projs } = await supabase
      .from("provider_portfolio_projects")
      .select("id, title, description, sort_order")
      .eq("provider_profile_id", profile.id)
      .order("sort_order");

    const projectsWithImages: PortfolioProject[] = [];
    for (const p of projs ?? []) {
      const { data: imgs } = await supabase
        .from("provider_portfolio_images")
        .select("id, file_url, file_name, caption, sort_order")
        .eq("project_id", p.id)
        .order("sort_order");
      projectsWithImages.push({ ...p, images: imgs ?? [] });
    }
    setProjects(projectsWithImages);
    setLoading(false);
  };

  const saveBio = async () => {
    setSavingBio(true);
    const { error } = await supabase
      .from("provider_profiles")
      .update({ public_bio: publicBio.trim() } as any)
      .eq("user_id", user!.id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Bio saved" });
    setSavingBio(false);
  };

  const createProject = async () => {
    if (!newTitle.trim() || !profileId) return;
    setCreatingProject(true);
    const { error } = await supabase.from("provider_portfolio_projects").insert({
      provider_profile_id: profileId,
      user_id: user!.id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      sort_order: projects.length,
    } as any);
    if (error) toast({ title: "Failed to create project", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Project created" });
      setShowNewProject(false);
      setNewTitle("");
      setNewDesc("");
      fetchAll();
    }
    setCreatingProject(false);
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase.from("provider_portfolio_projects").delete().eq("id", projectId);
    if (error) toast({ title: "Delete failed", variant: "destructive" });
    else { toast({ title: "Project deleted" }); fetchAll(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !uploadingProjectId) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} is too large (max 5MB)`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${uploadingProjectId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, file);
      if (upErr) { toast({ title: `Upload failed: ${file.name}`, variant: "destructive" }); continue; }

      const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(path);

      await supabase.from("provider_portfolio_images").insert({
        project_id: uploadingProjectId,
        user_id: user!.id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        sort_order: 0,
      } as any);
    }

    toast({ title: "Images uploaded" });
    setUploading(false);
    setUploadingProjectId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchAll();
  };

  const deleteImage = async (imageId: string) => {
    await supabase.from("provider_portfolio_images").delete().eq("id", imageId);
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (status !== "active") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Your portfolio page will be available once your account is approved.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">My Portfolio Page</h2>
          <p className="text-muted-foreground text-sm">This is your public page visible to customers</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/providers/${user!.id}`)}>
          <Eye className="mr-2 h-4 w-4" /> Preview
        </Button>
      </div>

      {/* Public Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Your Business</CardTitle>
          <CardDescription>Write a detailed description for customers visiting your page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={publicBio}
            onChange={e => setPublicBio(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Tell customers about your business, experience, approach to work..."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{publicBio.length}/2000</p>
            <Button size="sm" onClick={saveBio} disabled={savingBio}>
              {savingBio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Bio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Project Showcase</h3>
        <Button size="sm" onClick={() => setShowNewProject(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ImageIcon className="mx-auto h-10 w-10 mb-2 opacity-40" />
            <p>No projects yet. Add your first completed project to showcase your work.</p>
          </CardContent>
        </Card>
      )}

      {projects.map(project => (
        <Card key={project.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{project.title}</CardTitle>
                {project.description && <CardDescription className="mt-1">{project.description}</CardDescription>}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setUploadingProjectId(project.id);
                    fileInputRef.current?.click();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteProject(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {project.images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images yet. Click + to add photos.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {project.images.map(img => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.file_url}
                      alt={img.caption || img.file_name}
                      className="rounded-md w-full h-28 object-cover"
                    />
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-1 right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />
      {uploading && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Kitchen Renovation in SW1" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the work completed..." rows={3} maxLength={1000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>Cancel</Button>
            <Button onClick={createProject} disabled={creatingProject || !newTitle.trim()}>
              {creatingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderPortfolio;
