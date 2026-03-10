import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface CalendarEventProps {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

function formatDateForGoogle(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatDateForIcs(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function getDefaultEndDate(startDate: string): string {
  const date = new Date(startDate);
  date.setHours(date.getHours() + 1);
  return date.toISOString();
}

export function CalendarExport({
  title,
  description,
  startDate,
  endDate,
  location,
}: CalendarEventProps) {
  const { language } = useLanguage();

  const labels = {
    google: language === "fr" ? "Ajouter à Google Calendar" : "Add to Google Calendar",
    outlook: language === "fr" ? "Ajouter à Outlook" : "Add to Outlook",
  };

  const resolvedEndDate = endDate || getDefaultEndDate(startDate);

  const handleGoogleCalendar = () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(resolvedEndDate)}`,
    });

    if (description) params.set("details", description);
    if (location) params.set("location", location);

    window.open(
      `https://www.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleOutlookDownload = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TrainPro Academy//CalendarSync//EN",
      "BEGIN:VEVENT",
      `DTSTART:${formatDateForIcs(startDate)}`,
      `DTEND:${formatDateForIcs(resolvedEndDate)}`,
      `SUMMARY:${title}`,
    ];

    if (description) lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);

    lines.push("END:VEVENT", "END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleGoogleCalendar}>
        <ExternalLink className="mr-2 h-4 w-4" />
        {labels.google}
      </Button>
      <Button variant="outline" size="sm" onClick={handleOutlookDownload}>
        <Calendar className="mr-2 h-4 w-4" />
        {labels.outlook}
      </Button>
    </div>
  );
}
