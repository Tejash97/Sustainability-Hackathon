/**
 * Google Ecosystem Integrations: Google Calendar & Gmail Scheduling
 * 100% Google Tools integration for RiverRevive AI
 */

export interface GoogleCalendarEventOptions {
  title: string;
  description: string;
  location: string;
  startDate?: Date;
  durationHours?: number;
  userEmail?: string | null;
}

export interface GmailShareOptions {
  to?: string;
  subject: string;
  body: string;
  userEmail?: string | null;
}

/**
 * Formats a Date object into UTC format YYYYMMDDTHHmmssZ required by Google Calendar URL template.
 */
function formatGoogleCalendarDate(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Computes default target date (upcoming Saturday at 07:30 AM local time).
 */
export function getDefaultCleanupDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const diffDays = (6 - day + 7) % 7 || 7; // Next Saturday
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffDays, 7, 30, 0);
  return target;
}

/**
 * Formats a Date object into a local 'YYYY-MM-DDTHH:MM' string for datetime-local inputs
 * without converting or shifting timezones.
 */
export function formatToLocalInputIso(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Formats a Date object into a human-friendly canonical schedule string:
 * e.g. "Saturday, Oct 17, 2026 • 07:30 AM – 10:00 AM"
 */
export function formatCanonicalScheduleString(start: Date, durationHours: number = 2.5): string {
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTimeStr = end.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} • ${startTimeStr} – ${endTimeStr}`;
}

/**
 * Generates an instant Google Calendar event creation URL for the user's Google account.
 * When opened, Google Calendar pre-populates all event fields with 1-click 'Save'.
 */
export function createGoogleCalendarUrl(options: {
  title: string;
  description: string;
  location: string;
  startDate?: Date;
  durationHours?: number;
  userEmail?: string | null;
}): string {
  const start = options.startDate || getDefaultCleanupDate();
  const duration = options.durationHours || 2.5;
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

  const startIso = formatGoogleCalendarDate(start);
  const endIso = formatGoogleCalendarDate(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `RiverRevive: ${options.title}`,
    dates: `${startIso}/${endIso}`,
    details: options.description,
    location: options.location,
  });

  if (options.userEmail) {
    params.set('authuser', options.userEmail);
    params.set('add', options.userEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an instant Gmail Web compose URL.
 * When clicked by a signed-in Google user, it opens a new Gmail draft pre-filled with subject and formatted cleanup blueprint.
 */
export function createGmailComposeUrl(options: GmailShareOptions): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    su: options.subject,
    body: options.body,
  });

  if (options.userEmail) {
    params.set('authuser', options.userEmail);
  }

  if (options.to) {
    params.set('to', options.to);
  }

  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Formats an end-to-end Cleanup Drive Plan into a professional, compelling Gmail invitation email.
 */
export function formatPlanForEmailBody(options: {
  title: string;
  tagline?: string;
  locationName: string;
  meetingPoint?: string;
  scheduledTime?: string;
  durationHours?: number;
  volunteersNeeded?: number;
  civilianVolunteers?: number;
  specialistStaffing?: string;
  volunteerSafe?: boolean;
  gearNeeded?: string[];
  safetyGuidelines?: string[];
  organizerName?: string;
  organizerEmail?: string;
  googleMapsUrl?: string;
}): string {
  const isRestricted = options.volunteerSafe === false || options.volunteersNeeded === 0;

  const organizer = options.organizerName
    ? `${options.organizerName}${options.organizerEmail ? ` (${options.organizerEmail})` : ''}`
    : options.organizerEmail || (isRestricted ? 'Environmental Safety Officer' : 'Community Eco Volunteer');

  const gearText =
    options.gearNeeded && options.gearNeeded.length > 0
      ? options.gearNeeded.map((g) => `  • ${g}`).join('\n')
      : isRestricted
      ? '  • Level-B Vapor-Tight Chemical Suits\n  • Full-Face NIOSH Respirators\n  • Heavy Chemical Nitrile Gauntlets\n  • Industrial Vacuum Tanker Truck'
      : '  • Heavy Nitrile Gloves\n  • Mud Boots / Waders\n  • Trash Grabber Claws\n  • Collection Sacks';

  const safetyText =
    options.safetyGuidelines && options.safetyGuidelines.length > 0
      ? options.safetyGuidelines.map((s) => `  ⚠️ ${s}`).join('\n')
      : isRestricted
      ? '  ⚠️ STRICT RESTRICTION: No civilian or student volunteer entry allowed.\n  ⚠️ Certified Hazmat personnel only with Level-B PPE.\n  ⚠️ Maintain 20m safety perimeter from dark industrial chemical inflow.'
      : '  ⚠️ Avoid direct skin contact with contaminated water.\n  ⚠️ Hydrate frequently and wear puncture-proof gloves.';

  if (isRestricted) {
    return `ATTENTION: MUNICIPAL ENVIRONMENTAL DIVISION & CERTIFIED HAZMAT CONTRACTORS

This is an official Hazardous Materials Remediation & Containment Dispatch generated by RiverRevive AI Environmental Sentinel.

⚠️ CRITICAL SAFETY DIRECTIVE:
THIS IS A RESTRICTED HAZMAT ZONE. CIVILIAN AND COMMUNITY VOLUNTEERS ARE STRICTLY PROHIBITED FROM ENTERING OR PARTICIPATING.
Remediation must be performed exclusively by certified municipal hazardous materials contractors equipped with Level-B protection and industrial vacuum extraction equipment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HAZMAT REMEDIATION MISSION OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Site / Outflow: ${options.title}
${options.tagline ? `💬 Protocol Directive: "${options.tagline}"\n` : ''}
📍 Target Waterbody: ${options.locationName}
🏢 Incident Command / Assembly Point: ${options.meetingPoint || 'Municipal Hazmat Incident Command Post / Cordon Perimeter'}
⏰ Target Date & Time: ${options.scheduledTime || 'Designated Hazmat Shift'} (Duration: ~${options.durationHours || 4.0} Hours)
🚫 Civilian Volunteers: 0 (Civilian Participation Strictly Barred)
👷 Required Specialist Staffing: ${options.specialistStaffing || '4 Certified Hazmat Operators + 2 Environmental Safety Officers'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED SPECIALIZED GEAR & PPE MATRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gearText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HAZMAT CONTAINMENT & SAFETY PROTOCOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${safetyText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GEOSPATIAL COORDINATES & ACCESS PERIMETER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Access Site Perimeter via Google Maps:
${options.googleMapsUrl || 'https://maps.google.com'}

Authorized by: ${organizer}
Platform: RiverRevive AI (Google Gemini Multimodal Hydrology Sentinel)
`;
  }

  return `Hello Eco Guardians & Community Volunteers,

You are invited to join an upcoming riverbank and waterbody cleanup drive mobilized by RiverRevive AI!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLEANUP MISSION OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Incident: ${options.title}
${options.tagline ? `💬 Motto: "${options.tagline}"\n` : ''}
📍 Target Waterbody: ${options.locationName}
🏢 Meeting / Assembly Point: ${options.meetingPoint || 'Riverbank Ghat Entrance / Access Steps'}
⏰ Target Date & Time: ${options.scheduledTime || 'Saturday • 07:30 AM'} (Duration: ~${options.durationHours || 2.5} Hours)
👥 Recommended Volunteers: ${options.volunteersNeeded ?? 15} Community Guardians

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED TOOLS & PPE GEAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gearText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY & HYDRATION PROTOCOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${safetyText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOOGLE MAPS NAVIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Navigate directly to the site:
${options.googleMapsUrl || 'https://maps.google.com'}

Organized by: ${organizer}
Generated with: RiverRevive AI (Google Gemini Multimodal Hydrology Sentinel)

Let's revive our rivers together!
`;
}

/**
 * Downloads a standard .ics iCalendar file for any external calendar application.
 */
export function downloadIcsCalendarFile(options: {
  title: string;
  description: string;
  location: string;
  startDate?: Date;
  durationHours?: number;
}): void {
  const start = options.startDate || getDefaultCleanupDate();
  const duration = options.durationHours || 2.5;
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

  const startIso = formatGoogleCalendarDate(start);
  const endIso = formatGoogleCalendarDate(end);

  const cleanDesc = options.description.replace(/\n/g, '\\n');
  const cleanTitle = options.title.replace(/\n/g, ' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RiverRevive AI//Cleanup Drive//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:riverrevive-${Date.now()}@riverrevive.ai`,
    `DTSTAMP:${formatGoogleCalendarDate(new Date())}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:RiverRevive: ${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${options.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RiverRevive_Cleanup_${Date.now()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
