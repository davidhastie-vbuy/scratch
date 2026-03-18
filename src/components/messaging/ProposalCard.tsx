import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, PoundSterling, CalendarDays, Clock, RefreshCw, ListChecks } from "lucide-react";
import { format } from "date-fns";

interface ProposalData {
  agreed_price: number;
  start_date?: string;
  start_time?: string;
  duration?: string;
  urgency?: string;
  urgency_label?: string;
  status: "pending" | "accepted" | "declined";
}

interface Props {
  proposal: ProposalData;
  isOwnMessage: boolean;
  role: "customer" | "provider";
  onAccept?: () => void;
  onDecline?: () => void;
  onCounter?: () => void;
  onSetupMilestones?: () => void;
  accepting?: boolean;
  hasAcceptedProposal?: boolean;
}

const ProposalCard = ({ proposal, isOwnMessage, role, onAccept, onDecline, onCounter, onSetupMilestones, accepting, hasAcceptedProposal }: Props) => {
  const isPending = proposal.status === "pending";
  const isAccepted = proposal.status === "accepted";
  const isDeclined = proposal.status === "declined";

  // Both sides can accept or counter proposals sent TO them, but NOT if any proposal is already accepted
  const canRespond = isPending && !isOwnMessage && !hasAcceptedProposal;

  return (
    <Card className={`max-w-[85%] border-2 ${isAccepted ? "border-green-500/30 bg-green-50/50" : isDeclined ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isOwnMessage ? "Your Proposal" : role === "customer" ? "Proposal from Provider" : "Proposal from Customer"}
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
          {proposal.start_date && proposal.start_time && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{format(new Date(proposal.start_date), "PPP")} at {proposal.start_time}</span>
            </div>
          )}
          {proposal.duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{proposal.duration}</span>
            </div>
          )}
          {proposal.urgency_label && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Needed: {proposal.urgency_label}</span>
            </div>
          )}
        </div>

        {canRespond && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={onAccept} disabled={accepting} className="flex-1">
              <Check className="mr-1 h-3.5 w-3.5" /> Accept
            </Button>
            {onCounter && (
              <Button size="sm" variant="secondary" onClick={onCounter} disabled={accepting} className="flex-1">
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Counter
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onDecline} disabled={accepting} className="flex-1">
              <X className="mr-1 h-3.5 w-3.5" /> Decline
            </Button>
          </div>
        )}

        {isAccepted && (
          <div className="space-y-2">
            {onSetupMilestones ? (
              <>
                <p className="text-xs text-green-700 font-medium">✓ Terms confirmed — work has been scheduled</p>
                <Button size="sm" onClick={onSetupMilestones} className="w-full">
                  <ListChecks className="mr-2 h-4 w-4" /> Set Up Milestones & Start Job
                </Button>
              </>
            ) : (
              <p className="text-xs text-green-700 font-medium">✓ Terms accepted — awaiting customer confirmation</p>
            )}
          </div>
        )}
        {isDeclined && (
          <p className="text-xs text-destructive font-medium">Terms declined</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
