import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Briefcase, MessageSquare, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground">What do you need done today?</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate("/dashboard/post-job")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlusCircle className="h-5 w-5 text-primary" />
              Post a Job
            </CardTitle>
            <CardDescription>Get up to 3 quotes from local tradespeople</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate("/dashboard/jobs")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              My Jobs
            </CardTitle>
            <CardDescription>View your posted jobs and quotes</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate("/dashboard/messages")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Messages
            </CardTitle>
            <CardDescription>Chat with your tradespeople</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default CustomerHome;
