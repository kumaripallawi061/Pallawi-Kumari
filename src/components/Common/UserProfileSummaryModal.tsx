import React, { useState, useRef } from 'react';
import { Student, SchoolStaffUser, UserSession } from '../../types/fee';
import { 
  X, 
  Camera, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  BookOpen, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  CreditCard, 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  Hash, 
  Home, 
  ChevronRight,
  Trash2,
  Check,
  Link
} from 'lucide-react';

export const AVATAR_PRESETS = [
  { id: 'av-1', label: 'Male Scholar 1', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Female Scholar 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Male Scholar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Female Scholar 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-5', label: 'Faculty / Admin 1', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Faculty / Admin 2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
];

interface Props {
  session: UserSession | null;
  student?: Student | null;
  staffUser?: SchoolStaffUser | null;
  onClose: () => void;
  onUpdateProfilePicture: (photoUrl: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const UserProfileSummaryModal: React.FC<Props> = ({
  session,
  student,
  staffUser,
  onClose,
  onUpdateProfilePicture,
  onNavigateTab,
}) => {
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStudent = session?.role === 'student' || !!student;
  const currentPhoto = student?.profilePicture || staffUser?.profilePicture || session?.profilePicture;
  const displayName = student?.name || staffUser?.name || session?.name || 'User Profile';

  // Helper to extract initials
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Handle device file upload (converts to base64 for persistent preview)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoFeedback('Please upload a valid image file (JPG, PNG, WebP).');
      setTimeout(() => setPhotoFeedback(null), 3500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoFeedback('File size exceeds 5MB. Please choose a smaller photo.');
      setTimeout(() => setPhotoFeedback(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateProfilePicture(reader.result);
        setShowPhotoPicker(false);
        setPhotoFeedback('Profile picture updated from device!');
        setTimeout(() => setPhotoFeedback(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    onUpdateProfilePicture(url);
    setShowPhotoPicker(false);
    setPhotoFeedback('Preset avatar applied successfully!');
    setTimeout(() => setPhotoFeedback(null), 3500);
  };

  const handleRemovePhoto = () => {
    onUpdateProfilePicture('');
    setShowPhotoPicker(false);
    setPhotoFeedback('Profile picture removed. Placeholder restored.');
    setTimeout(() => setPhotoFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto flex flex-col relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold tracking-wide px-3 py-1 rounded-full ${
              isStudent 
                ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300' 
                : 'bg-purple-100 text-purple-900 border-2 border-purple-300'
            }`}>
              {isStudent ? 'Academic Profile Summary' : 'Institutional Staff Profile'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              RLSY-ERP-{session?.id || 'ID'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Feedback Notification */}
        {photoFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{photoFeedback}</span>
          </div>
        )}

        {/* Hero Section: Avatar Placeholder & Primary Identity */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            
            {/* Avatar Placeholder / Image with Camera Action */}
            <div className="relative group shrink-0">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/90 shadow-md ring-2 ring-emerald-400/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-700 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white/90 shadow-md ring-2 ring-emerald-400/50">
                  {getInitials(displayName)}
                </div>
              )}

              {/* Quick Tap-to-Change Button */}
              <button
                type="button"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className="absolute -bottom-1 -right-1 bg-white text-emerald-800 hover:bg-emerald-50 p-2 rounded-full shadow-lg border border-slate-200 transition-transform hover:scale-110"
                title="Change or upload profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{displayName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {isStudent ? 'Regular Enrolled' : staffUser?.role || session?.staffRole || 'Faculty / Admin'}
                </span>
              </div>

              {isStudent && student && (
                <p className="text-xs text-emerald-200 font-mono font-medium">
                  Roll No: <strong className="text-white font-mono">{student.rollNo}</strong> · Reg: {student.registerNo}
                </p>
              )}

              <p className="text-xs text-slate-300">
                {isStudent && student
                  ? `${student.course} · ${student.branch} (Semester ${student.semester})`
                  : staffUser?.designation || session?.staffDesignation || 'Institutional Officer & Bursar'}
              </p>

              {isStudent ? (
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-emerald-300 font-mono">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span>{student?.course} {student?.year ? `· Year ${student.year}` : ''} · Sem {student?.semester}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Roll No: {student?.rollNo}</span>
                  </span>
                </div>
              ) : (
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-emerald-300 font-mono">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-400" />
                    <span>{staffUser?.email || session?.emailOrPhone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{staffUser?.phone || '+91 98765 43210'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Upload / Preset Selector Drawer */}
        {showPhotoPicker && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Update Profile Picture</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Close
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Upload a custom headshot from your device or pick a pre-formatted academic portrait:
            </p>

            {/* Device File Input */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
              </button>

              {currentPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Picture</span>
                </button>
              )}
            </div>

            {/* Direct Image URL input */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Or Paste Image Web Link (HTTPS URL):
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://example.com/headshot.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  disabled={!imageUrlInput.trim()}
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      onUpdateProfilePicture(imageUrlInput.trim());
                      setImageUrlInput('');
                      setShowPhotoPicker(false);
                      setPhotoFeedback('Profile picture updated via web link!');
                      setTimeout(() => setPhotoFeedback(null), 3500);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  Apply URL
                </button>
              </div>
            </div>

            {/* Presets Gallery */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Or Select Academic Avatar Preset:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className="group relative rounded-full overflow-hidden border-2 hover:border-emerald-600 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 aspect-square"
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    {currentPhoto === preset.url && (
                      <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STUDENT ACADEMIC PROFILE SUMMARY DETAILS */}
        {/* ============================================================== */}
        {isStudent && student && (
          <div className="space-y-3 text-xs max-h-[360px] overflow-y-auto pr-1">
            
            {/* Card 1: Academic & Enrollment Matrix */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Academic Standing & Curriculum</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Program & Branch:</span>
                  <span className="font-semibold text-slate-800">{student.course} ({student.branch})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Stage:</span>
                  <span className="font-semibold text-slate-800">Year {student.year} · Sem {student.semester}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Batch Session:</span>
                  <span className="font-mono font-semibold text-slate-800">{student.admissionYear} - {student.admissionYear + 4}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Curriculum Stream:</span>
                  <span className="font-mono font-bold text-emerald-800">{student.streamCode || 'CSE'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Attendance Standing:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>88.5% (Eligible)</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cumulative CGPA:</span>
                  <span className="font-mono font-bold text-indigo-700">8.42 / 10.0 (Distinction)</span>
                </div>
              </div>

              {/* Enrolled Subjects Chips */}
              {student.subjectsEnrolled && student.subjectsEnrolled.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 text-[10px]">
                  <span className="text-slate-400 font-semibold block mb-1">Enrolled Semester Subjects:</span>
                  <div className="flex flex-wrap gap-1">
                    {student.subjectsEnrolled.map((sub, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-700">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Fee Clearance & Exam Eligibility */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Fee Ledger & Exam Admit Card</span>
                </div>
                {!student.hallTicketBlocked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Admit Card Cleared</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Admit Card Withheld</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Annual Fee</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{student.totalFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Fee Cleared</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">₹{student.paidFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Outstanding</span>
                  <span className={`font-mono font-bold text-xs ${student.pendingFee > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                    ₹{student.pendingFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Admission Quota & Campus Facilities */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
                <Home className="w-4 h-4 text-emerald-700" />
                <span>Statutory Admission & Campus Facilities</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Social Category:</span>
                  <span className="font-semibold text-slate-800">{student.category} {student.subCaste ? `(${student.subCaste})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Domicile State:</span>
                  <span className="font-semibold text-slate-800">{student.domicileState || 'Bihar'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Hostel Status:</span>
                  <span className="font-semibold text-slate-800">
                    {student.hostelResident ? 'Hostel Resident' : 'Day Scholar'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Hostel Room:</span>
                  <span className="font-mono text-slate-800">{student.hostelRoomNo || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Annual Income:</span>
                  <span className="font-mono text-slate-800">₹{(student.annualFamilyIncome || 180000).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Guardian & Personal Details */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Guardian & Personal Details</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Father / Guardian:</span>
                  <span className="font-semibold text-slate-800">{student.fatherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Birth:</span>
                  <span className="font-mono text-slate-800">{student.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Gender:</span>
                  <span className="text-slate-800">{student.gender || 'Male'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAFF USER PROFILE DETAILS */}
        {/* ============================================================== */}
        {!isStudent && (staffUser || session) && (
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
                <Briefcase className="w-4 h-4 text-purple-700" />
                <span>Administrative Posting & Responsibilities</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Employee Code:</span>
                  <span className="font-mono font-bold text-slate-900">{staffUser?.employeeCode || 'EMP-SYS-001'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Designation:</span>
                  <span className="font-semibold text-slate-800">{staffUser?.designation || session?.staffDesignation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="font-semibold text-slate-800">{staffUser?.department || 'Institutional Accounts & ERP Cell'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Role Code:</span>
                  <span className="font-mono font-bold text-purple-800">{staffUser?.role || session?.staffRole}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">State IFMS Treasury Code:</span>
                  <span className="font-mono font-semibold text-slate-800">2049-RLSY-PATNA</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Status:</span>
                  <span className="font-bold text-emerald-700">Active & Authorized</span>
                </div>
              </div>

              {staffUser?.permissions && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] mb-1">Assigned ERP Privileges:</span>
                  <div className="flex flex-wrap gap-1">
                    {staffUser.permissions.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700 font-medium">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
          {isStudent && onNavigateTab ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('student_idcard');
                  onClose();
                }}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Open Digital ID</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('student_fees');
                  onClose();
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>View Fees</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-mono">
              RLSY ERP · Verified Institutional Session
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm ml-auto"
          >
            Close Summary
          </button>
        </div>

      </div>
    </div>
  );
};
