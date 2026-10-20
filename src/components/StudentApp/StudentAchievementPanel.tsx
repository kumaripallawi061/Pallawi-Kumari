import React, { useState } from 'react';
import { 
  StudentAchievement, 
  Student 
} from '../../types/fee';
import { 
  Award, 
  Trophy, 
  Medal, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  ExternalLink, 
  ShieldCheck, 
  UserCheck, 
  FileText,
  Star,
  Search,
  Filter,
  X,
  Camera,
  Download
} from 'lucide-react';
import { captureScreenshot } from '../../utils/screenshot';
import { safeMatchStrings } from '../../utils/safeHelpers';

interface Props {
  achievements: StudentAchievement[];
  student: Student;
}

export const StudentAchievementPanel: React.FC<Props> = ({
  achievements,
  student,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewCertUrl, setPreviewCertUrl] = useState<string | null>(null);

  // STRICT PRIVACY ENFORCEMENT: Only show achievements for this student's Roll No!
  const myAchievements = achievements.filter(
    (a) => safeMatchStrings(a.studentRollNo, student?.rollNo)
  );

  const categories = ['ALL', ...Array.from(new Set(myAchievements.map((a) => a.category)))];

  const filteredAchievements = selectedCategory === 'ALL'
    ? myAchievements
    : myAchievements.filter((a) => a.category === selectedCategory);

  const goldCount = myAchievements.filter((a) => a.badgeLevel === 'Gold' || a.badgeLevel === 'Special Honor').length;
  const totalGems = myAchievements.reduce((acc, a) => acc + (a.gemsAwarded || 0), 0);

  return (
    <div id="student-awards-portfolio" className="space-y-4">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                Official Student Hall of Fame
              </span>
              <span className="text-xs text-amber-100 font-mono font-bold">
                Roll No: {student.rollNo}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-200" />
              <span>Student Honors & Achievements</span>
            </h2>
            <p className="text-xs text-amber-100 max-w-lg mt-0.5">
              Verified curricular, athletic, research, and extracurricular distinctions logged exclusively for your institutional profile.
            </p>
          </div>

          {/* Quick Metrics & Screenshot Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('student-awards-portfolio');
                if (el) {
                  captureScreenshot(el, { filename: `RLSY_Awards_Portfolio_${student.rollNo.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
                }
              }}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-xs border border-white/30 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Capture and download full Awards & Honors Portfolio screenshot"
            >
              <Camera className="w-3.5 h-3.5 text-amber-200" />
              <span>Screenshot Awards</span>
            </button>
            <div className="px-3.5 py-2 bg-white/25 backdrop-blur-xs border border-white/30 rounded-xl text-center shadow-xs">
              <span className="text-base font-black font-mono text-white block flex items-center justify-center gap-1">
                <span>💎</span>
                <span>{totalGems}</span>
              </span>
              <span className="text-[10px] font-bold text-amber-100 uppercase">Gems</span>
            </div>
            <div className="px-3.5 py-2 bg-white/15 backdrop-blur-xs border border-white/20 rounded-xl text-center">
              <span className="text-base font-black font-mono text-white block">{myAchievements.length}</span>
              <span className="text-[10px] font-bold text-amber-100 uppercase">Recognitions</span>
            </div>
            <div className="px-3.5 py-2 bg-white/15 backdrop-blur-xs border border-white/20 rounded-xl text-center">
              <span className="text-base font-black font-mono text-white block">{goldCount}</span>
              <span className="text-[10px] font-bold text-amber-100 uppercase">Gold Honors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {myAchievements.length > 0 && categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? `All Honors (${myAchievements.length})` : cat}
            </button>
          ))}
        </div>
      )}

      {/* Achievements Cards Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              No Achievements Logged for Roll No: <span className="font-mono text-indigo-700">{student.rollNo}</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Achievements are entered and verified by authorized faculty, department heads, and academic administrators. 
              Once recorded in the institutional registry, your awards will display here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((item) => {
            const isGold = item.badgeLevel === 'Gold' || item.badgeLevel === 'Special Honor';
            const isSilver = item.badgeLevel === 'Silver';

            return (
              <div
                key={item.id}
                id={`award-card-${item.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group"
              >
                {/* Decorative subtle ribbon */}
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-xl pointer-events-none ${
                  isGold ? 'bg-amber-100' : isSilver ? 'bg-slate-100' : 'bg-emerald-100'
                }`} />

                <div className="space-y-2 relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isGold 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isSilver
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        <Medal className="w-3 h-3" />
                        <span>{item.badgeLevel || 'Distinction'}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.category}
                      </span>

                      {Boolean(item.gemsAwarded) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                          <span>💎</span>
                          <span>+{item.gemsAwarded} Gems</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                      {item.title}
                    </h4>
                    {item.scoreOrRank && (
                      <span className="inline-block mt-0.5 text-[11px] font-bold text-amber-700 font-mono">
                        🏆 {item.scoreOrRank}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Footer details: Awarded by & Verifier */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 relative z-10 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Awarding Body:</span>
                    <strong className="text-slate-800">{item.awardedBy}</strong>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Filed by {item.recordedByStaffName}</span>
                    </span>
                    <span className="font-mono text-emerald-700 font-semibold">{item.recordedByStaffRole}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {item.certificateUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewCertUrl(item.certificateUrl || null)}
                        className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                        <span>View Certificate</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`award-card-${item.id}`);
                        if (el) {
                          captureScreenshot(el, { filename: `RLSY_Award_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_${student.rollNo.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
                        }
                      }}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Screenshot and save this Award Card as PNG"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Screenshot</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Certificate Preview Modal */}
      {previewCertUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Verified Certificate of Honor</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCertUrl(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="verified-certificate-preview" className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 aspect-video flex items-center justify-center">
              <img
                src={previewCertUrl}
                alt="Certificate"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center text-xs text-slate-500">
              Digital certificate issued and archived in RLSY Student Ledger for Roll No: <strong className="font-mono text-slate-800">{student.rollNo}</strong>.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('verified-certificate-preview');
                  if (el) {
                    captureScreenshot(el, { filename: `RLSY_Certificate_Of_Honor_${student.rollNo.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
                  }
                }}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Capture and download Certificate screenshot"
              >
                <Camera className="w-4 h-4" />
                <span>Screenshot Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewCertUrl(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
