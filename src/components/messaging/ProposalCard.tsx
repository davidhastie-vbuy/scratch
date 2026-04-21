import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, PoundSterling, CalendarDays, Clock, RefreshCw, ListChecks, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProposalData {
  agreed_price: number;
  start_date?: string;
  start_time?: string;
  duration?: string;
  urgency?: string;
  urgency_label?: string;
  status: "pending" | "accepted" | "declined" | "superseded";
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
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const isPending = proposal.status === "pending";
  const isAccepted = proposal.status === "accepted";
  const isDeclined = proposal.status === "declined";
  const isSuperseded = proposal.status === "superseded";

  const showActions = isPending && !isOwnMessage;
  const actionsLocked = !!hasAcceptedProposal;

  const badgeLabel = isSuperseded ? "accepted" : proposal.status;
  const badgeVariant = isAccepted || isSuperseded ? "default" : isDeclined ? "destructive" : "secondary";
  const borderClass = isAccepted || isSuperseded
    ? "border-green-500/30 bg-green-50/50"
    : isDeclined
      ? "border-destructive/30 bg-destructive/5"
      : "border-primary/30 bg-primary/5";

  return (
    <Card className={`max-w-[85%] border-2 ${borderClass}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isOwnMessage ? "Your Proposal" : role === "customer" ? "Proposal from Provider" : "Proposal from Customer"}
          </span>
          <Badge variant={badgeVariant} className="text-xs">
            {badgeLabel}
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
        </div>

        {showActions && (
          <div className="space-y-2 pt-1">
          <div className="flex gap-2 items-center">
              <Button size="sm" onClick={onAccept} disabled={accepting || actionsLocked} className="flex-1">
                <Check className="mr-1 h-3.5 w-3.5" /> Accept
              </Button>
              {onCounter && (
                <Button size="sm" variant="secondary" onClick={onCounter} disabled={accepting || actionsLocked} className="flex-1">
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Counter
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setShowDeclineConfirm(true)} disabled={accepting || actionsLocked} className="px-2 text-xs text-muted-foreground hover:text-destructive">
                <X className="mr-1 h-3 w-3" /> Decline
              </Button>
            </div>
            {actionsLocked && (
              <p className="text-xs text-muted-foreground">
                Actions are locked because the job has already been accepted in principle.
              </p>
            )}

            <AlertDialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Decline this proposal?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is final. Once you decline this proposal you will no longer be able to accept or counter it. Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go Back</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      setShowDeclineConfirm(false);
                      onDecline?.();
                    }}
                  >
                    Yes, Decline Proposal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            ) : role === "customer" ? (
              <p className="text-xs text-green-700 font-medium">✓ Terms accepted — the provider will set up milestones shortly</p>
            ) : (
              <p className="text-xs text-green-700 font-medium">✓ Terms accepted — awaiting milestone setup</p>
            )}
          </div>
        )}
        {isDeclined && (
          <p className="text-xs text-destructive font-medium">Terms declined</p>
        )}
        {isSuperseded && (
          <p className="text-xs text-green-700 font-medium">✓ Accepted — Terms Pending Confirmation</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
