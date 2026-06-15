import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isWithinInterval, startOfDay } from "date-fns";

type CalendarJob = {
  id: string;
  title: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  postcode_district: string;
  category: string;
};


const ProviderCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [loading, setLoading] = useState(true);
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const navigatePrev = () => setCurrentDate(subMonths(currentDate, 1));
  const navigateNext = () => setCurrentDate(addMonths(currentDate, 1));
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
      <h2 className="font-display text-2xl font-bold">My Calendar</h2>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={navigatePrev}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-center">
          <p className="font-semibold">{format(currentDate, "MMMM yyyy")}</p>
          <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={goToday}>Today</Button>
        </div>
        <Button variant="ghost" size="icon" onClick={navigateNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>

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
                  <div key={day.toISOString()} className={`min-h-[80px] border p-1 ${isCurrentMonth ? "bg-card" : "bg-muted/30"} ${isToday ? "ring-2 ring-primary" : ""}`}>
                    <div className={`text-xs font-medium mb-1 ${isCurrentMonth ? "" : "text-muted-foreground"}`}>{format(day, "d")}</div>
                    <div className="space-y-0.5">
                      {dayJobs.slice(0, 3).map(j => (
                        <div
                          key={j.id}
                          className={`text-[10px] px-1 py-0.5 truncate cursor-pointer ${statusColor(j.status)}`}
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
