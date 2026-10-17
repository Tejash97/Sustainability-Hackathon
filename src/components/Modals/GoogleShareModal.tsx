'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Mail,
  Share2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Download,
  Users,
  ShieldCheck,
  ShieldAlert,
  Send,
  Sparkles,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  createGoogleCalendarUrl,
  createGmailComposeUrl,
  formatPlanForEmailBody,
  downloadIcsCalendarFile,
  getDefaultCleanupDate,
  formatToLocalInputIso,
  formatCanonicalScheduleString,
} from '@/lib/googleIntegrations';

export interface PlanSharePayload {
  title: string;
  tagline?: string;
  locationName: string;
  meetingPoint?: string;
  scheduledTime?: string;
  targetDateTime?: string;
  durationHours?: number;
  volunteersNeeded?: number;
  civilianVolunteers?: number;
  specialistStaffing?: string;
  volunteerSafe?: boolean;
  gearNeeded?: string[];
  safetyGuidelines?: string[];
  googleMapsUrl?: string;
  actionSummary?: string;
}

interface GoogleShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: PlanSharePayload | null;
}

export const GoogleShareModal: React.FC<GoogleShareModalProps> = ({
  isOpen,
  onClose,
  planData,
}) => {
  const { user, userEmail, userName, userPhoto, signInWithGoogle, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'gmail'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return planData?.targetDateTime || formatToLocalInputIso(getDefaultCleanupDate());
  });
  const [durationHours, setDurationHours] = useState<number>(planData?.durationHours || 2.5);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Synchronize date and duration whenever modal opens or planData changes
  React.useEffect(() => {
    if (planData?.targetDateTime) {
      setSelectedDate(planData.targetDateTime);
    }
    if (planData?.durationHours) {
      setDurationHours(planData.durationHours);
    }
  }, [planData?.targetDateTime, planData?.durationHours]);

  if (!isOpen || !planData) return null;

  const isRestricted = planData.volunteerSafe === false || planData.volunteersNeeded === 0;

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (
        err.code === 'auth/configuration-not-found' ||
        err.message?.includes('configuration-not-found')
      ) {
        openAuthModal();
      } else {
        setAuthError(err.message || 'Google Sign-in failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const parsedStartDate = (() => {
    if (!selectedDate) return getDefaultCleanupDate();
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? getDefaultCleanupDate() : d;
  })();

  const canonicalScheduleText = formatCanonicalScheduleString(parsedStartDate, durationHours);

  const emailBodyText = formatPlanForEmailBody({
    title: planData.title,
    tagline: planData.tagline,
    locationName: planData.locationName,
    meetingPoint: planData.meetingPoint,
    scheduledTime: canonicalScheduleText,
    durationHours: durationHours,
    volunteersNeeded: planData.volunteersNeeded,
    civilianVolunteers: planData.civilianVolunteers,
    specialistStaffing: planData.specialistStaffing,
    volunteerSafe: planData.volunteerSafe,
    gearNeeded: planData.gearNeeded,
    safetyGuidelines: planData.safetyGuidelines,
    organizerName: userName || undefined,
    organizerEmail: userEmail || undefined,
    googleMapsUrl: planData.googleMapsUrl,
  });

  const emailSubjectText = isRestricted
    ? `⚠️ [RESTRICTED HAZMAT DISPATCH] Industrial Outflow Remediation: ${planData.title}`
    : `🌊 [RiverRevive Action Plan] Community Cleanup Drive: ${planData.title}`;

  const handleOpenGoogleCalendar = () => {
    const calendarUrl = createGoogleCalendarUrl({
      title: planData.title,
      description: emailBodyText,
      location: planData.locationName || 'Riverbank Ghat Access Steps',
      startDate: parsedStartDate,
      durationHours: durationHours,
      userEmail: userEmail,
    });
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGmail = () => {
    const gmailUrl = createGmailComposeUrl({
      to: recipientEmail,
      subject: emailSubjectText,
      body: emailBodyText,
      userEmail: userEmail,
    });
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubjectText}\n\n${emailBodyText}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleDownloadIcs = () => {
    downloadIcsCalendarFile({
      title: planData.title,
      description: emailBodyText,
      location: planData.locationName,
      startDate: parsedStartDate,
      durationHours: durationHours,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 my-6 text-slate-800 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isRestricted ? 'Hazmat Operation Dispatch' : 'Schedule & Share with Google'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                  isRestricted
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isRestricted ? 'HAZMAT DISPATCH • RESTRICTED' : 'CALENDAR & GMAIL'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isRestricted
                  ? 'Specialist coordination & municipal notification route'
                  : '1-click integration with your signed-in Google Account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Account Status Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userPhoto}
                  alt={userName || 'Google Account'}
                  className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  {userName?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">{userName}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    Signed in with Google
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">{userEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Sign in with your Google Account
                </p>
                <p className="text-[11px] text-slate-500">
                  Connect your Gmail to auto-schedule events to Google Calendar and send notifications.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {authError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {authError}
          </div>
        )}

        {/* Nav Pill Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold border border-slate-200/80">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{isRestricted ? '1. Schedule Hazmat Operation' : '1. Schedule in Google Calendar'}</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gmail'
                ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>{isRestricted ? '2. Dispatch Specialist Memo' : '2. Share Plan via Gmail'}</span>
          </button>
        </div>

        {/* TAB 1: GOOGLE CALENDAR SCHEDULING */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Event Date & Time */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isRestricted ? 'Hazmat Shift Date & Time:' : 'Cleanup Date & Start Time:'}</span>
                </label>
                <input
                  type="datetime-local"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Expected Duration:
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value={1.5}>1.5 Hours (Quick Shoreline Sweep)</option>
                  <option value={2.5}>2.5 Hours (Standard Cleanup Drive)</option>
                  <option value={4.0}>4.0 Hours (Specialist Extraction Shift)</option>
                  <option value={6.0}>Full Day Mobilization (2 Shifts)</option>
                </select>
              </div>
            </div>

            {/* Event Summary Card */}
            <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
              isRestricted
                ? 'bg-gradient-to-r from-rose-50/80 to-amber-50/60 border-rose-200'
                : 'bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">{planData.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isRestricted
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isRestricted ? 'Specialist Remediation' : `~${durationHours}h Session`}
                </span>
              </div>
              <p className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span><strong>Assembly:</strong> {planData.meetingPoint || planData.locationName}</span>
              </p>
              {isRestricted ? (
                <div className="space-y-1">
                  <p className="text-rose-700 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span><strong>Civilian Volunteers:</strong> 0 (Civilian Participation Barred)</span>
                  </p>
                  <p className="text-slate-700 font-medium flex items-center gap-1.5 pl-5">
                    <span><strong>Staffing:</strong> {planData.specialistStaffing || '4 Certified Hazmat Operators + 2 Environmental Safety Officers'}</span>
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Target:</strong> {planData.volunteersNeeded ?? 15} Community Volunteers</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Download standard .ics file for Outlook / Apple Calendar"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ICS File</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGoogleCalendar}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Calendar className="w-4 h-4 text-emerald-200" />
                <span>{isRestricted ? 'Add Hazmat Shift to Google Calendar' : 'Add to Google Calendar'}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SHARE VIA GMAIL */}
        {activeTab === 'gmail' && (
          <div className="space-y-4">
            {/* Recipient Input & Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{isRestricted ? 'Send Notification To (Municipal / Hazmat Agencies):' : 'Send via Gmail To (Recipients):'}</span>
                {userEmail && (
                  <button
                    type="button"
                    onClick={() => setRecipientEmail(userEmail)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    + Send to My Own Gmail ({userEmail})
                  </button>
                )}
              </label>

              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder={isRestricted ? 'e.g., hazmat.response@city.gov, spcb.director@state.gov' : 'e.g., eco.club@college.edu, volunteers@riverngo.org'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              />

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-slate-400 font-medium">Quick Presets:</span>
                {isRestricted ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('hazmat.response@city.gov')}
                      className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium"
                    >
                      Municipal Hazmat Division
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('spcb.water@state.gov')}
                      className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium"
                    >
                      State Pollution Board
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('municipal.sanitation@city.gov')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Sanitation Dept
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('volunteers@ecoclub.org')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Volunteers List
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('municipal.sanitation@city.gov')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Municipal Waste Dept
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Email Body Preview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {isRestricted ? 'Formatted Hazmat Dispatch Memo Preview:' : 'Formatted Email Invitation Preview:'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied' : (isRestricted ? 'Copy Memo' : 'Copy Text')}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {`Subject: ${emailSubjectText}\n\n${emailBodyText}`}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedEmail ? 'Copied to Clipboard!' : (isRestricted ? 'Copy Hazmat Dispatch Memo' : 'Copy Invitation Email')}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGmail}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                  isRestricted
                    ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-rose-600/20'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 shadow-red-600/20'
                }`}
              >
                <Mail className="w-4 h-4 text-white" />
                <span>{isRestricted ? 'Open & Dispatch Hazmat Memo' : 'Open & Send via Gmail'}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
