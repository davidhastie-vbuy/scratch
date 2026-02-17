import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, PoundSterling, CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";

interface ProposalData {
  agreed_price: number;
  start_date: string;
  start_time: string;
  duration: string;
  status: "pending" | "accepted" | "declined";
}

interface Props {
  proposal: ProposalData;
  isOwnMessage: boolean;
  role: "customer" | "provider";
  onAccept?: () => void;
  onDecline?: () => void;
  accepting?: boolean;
}

const ProposalCard = ({ proposal, isOwnMessage, role, onAccept, onDecline, accepting }: Props) => {
  const isPending = proposal.status === "pending";
  const isAccepted = proposal.status === "accepted";
  const isDeclined = proposal.status === "declined";

  return (
    <Card className={`max-w-[85%] border-2 ${isAccepted ? "border-green-500/30 bg-green-50/50" : isDeclined ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isOwnMessage ? "Your Proposal" : "Proposal from Provider"}
          </span>
          <Badge variant={isAccepted ? "default" : isDeclined ? "destructive" : "secondary"} className="text-xs">
            {proposal.status}
          </Badge>
        </div>

        <div className="grid gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <PoundSterling className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">£{Number(proposal.agreed_price).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{format(new Date(proposal.start_date), "PPP")} at {proposal.start_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{proposal.duration}</span>
          </div>
        </div>

        {isPending && role === "customer" && !isOwnMessage && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={onAccept} disabled={accepting} className="flex-1">
              <Check className="mr-1 h-3.5 w-3.5" /> Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={onDecline} disabled={accepting} className="flex-1">
              <X className="mr-1 h-3.5 w-3.5" /> Decline
            </Button>
          </div>
        )}

        {isAccepted && (
          <p className="text-xs text-green-700 font-medium">✓ Terms confirmed — work has been scheduled</p>
        )}
        {isDeclined && (
          <p className="text-xs text-destructive font-medium">Terms declined</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
