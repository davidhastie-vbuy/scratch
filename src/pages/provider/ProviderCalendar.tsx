import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isWithinInterval, addDays, startOfDay, setHours } from "date-fns";

type CalendarJob = {
  id: string;
  title: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  postcode_district: string;
  category: string;
};

type ViewMode = "week" | "month";

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ProviderCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, status, scheduled_start, scheduled_end, postcode_district, category")
      .eq("provider_id", user!.id)
      .in("status", ["accepted", "in_progress", "completed"])
      .not("scheduled_start", "is", null)
      .not("scheduled_end", "is", null);
    setJobs((data as any[]) ?? []);
    setLoading(false);
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const navigatePrev = () => {
    setCurrentDate(viewMode === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  };
  const navigateNext = () => {
    setCurrentDate(viewMode === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  const statusColor = (status: string) => {
    if (status === "accepted") return "bg-primary/80 text-primary-foreground";
    if (status === "in_progress") return "bg-warning text-warning-foreground";
    if (status === "completed") return "bg-success text-success-foreground";
    return "bg-muted text-muted-foreground";
  };

  const getJobsForDay = (day: Date) =>
    jobs.filter(j => {
      const start = new Date(j.scheduled_start);
      const end = new Date(j.scheduled_end);
      return isWithinInterval(day, { start: startOfDay(start), end: startOfDay(end) }) || isSameDay(day, start) || isSameDay(day, end);
    });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">My Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "week" ? "month" : "week")}>
            {viewMode === "week" ? <><LayoutGrid className="mr-1 h-4 w-4" /> Month</> : <><CalendarDays className="mr-1 h-4 w-4" /> Week</>}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={navigatePrev}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-center">
          <p className="font-semibold">
            {viewMode === "week"
              ? `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </p>
          <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={goToday}>Today</Button>
        </div>
        <Button variant="ghost" size="icon" onClick={navigateNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {viewMode === "week" ? (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-card z-10">
                <div className="p-2 text-xs text-muted-foreground" />
                {weekDays.map(day => (
                  <div key={day.toISOString()} className={`p-2 text-center text-xs font-medium border-l ${isSameDay(day, new Date()) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                    <div>{format(day, "EEE")}</div>
                    <div className="text-lg font-bold">{format(day, "d")}</div>
                  </div>
                ))}
              </div>
              {/* Time grid */}
              <div className="relative grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                {/* Hour labels */}
                {HOURS.map(h => (
                  <div key={h} className="absolute left-0 w-[60px] text-right pr-2 text-xs text-muted-foreground" style={{ top: h * HOUR_HEIGHT - 6 }}>
                    {h === 0 ? "" : format(setHours(new Date(), h), "ha")}
                  </div>
                ))}
                {/* Grid lines */}
                {HOURS.map(h => (
                  <div key={`line-${h}`} className="absolute left-[60px] right-0 border-t border-border" style={{ top: h * HOUR_HEIGHT }} />
                ))}
                {/* Day columns */}
                {weekDays.map((day, dayIdx) => {
                  const dayJobs = getJobsForDay(day);
                  return (
                    <div key={day.toISOString()} className="absolute border-l border-border" style={{ left: `calc(60px + ${(dayIdx / 7) * 100}% * 7 / 7)`, width: `calc((100% - 60px) / 7)`, top: 0, height: "100%" }}>
                      {dayJobs.map((j, jIdx) => {
                        const start = new Date(j.scheduled_start);
                        const end = new Date(j.scheduled_end);
                        const dayStart = startOfDay(day);
                        const visStart = isSameDay(day, start) ? start : dayStart;
                        const visEnd = isSameDay(day, end) ? end : addDays(dayStart, 1);
                        const topH = (visStart.getHours() + visStart.getMinutes() / 60) * HOUR_HEIGHT;
                        const botH = (visEnd.getHours() + visEnd.getMinutes() / 60) * HOUR_HEIGHT;
                        const height = Math.max(botH - topH, 20);
                        return (
                          <div
                            key={j.id}
                            className={`absolute rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer overflow-hidden ${statusColor(j.status)} opacity-90 hover:opacity-100 transition-opacity`}
                            style={{ top: topH, height, left: 2, right: 2 }}
                            onClick={() => navigate(`/provider/jobs/${j.id}`)}
                          >
                            <div className="font-semibold truncate">{j.title}</div>
                            <div className="truncate">{format(start, "h:mm a")} – {format(end, "h:mm a")}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-px">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {monthDays.map(day => {
                const dayJobs = getJobsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <div key={day.toISOString()} className={`min-h-[80px] border rounded-sm p-1 ${isCurrentMonth ? "bg-card" : "bg-muted/30"} ${isToday ? "ring-2 ring-primary" : ""}`}>
                    <div className={`text-xs font-medium mb-1 ${isCurrentMonth ? "" : "text-muted-foreground"}`}>{format(day, "d")}</div>
                    <div className="space-y-0.5">
                      {dayJobs.slice(0, 3).map(j => (
                        <div
                          key={j.id}
                          className={`text-[10px] rounded px-1 py-0.5 truncate cursor-pointer ${statusColor(j.status)}`}
                          onClick={() => navigate(`/provider/jobs/${j.id}`)}
                        >
                          {j.title}
                        </div>
                      ))}
                      {dayJobs.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayJobs.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {jobs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No scheduled jobs yet. Jobs will appear here once dates are set after a quote is accepted.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderCalendar;
