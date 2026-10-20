import React, { useState } from 'react';
import { HelpdeskConfig, HelpdeskCriterion } from '../../types/fee';
import { 
  Settings, 
  MessageSquare, 
  Mail, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Power, 
  Save, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: HelpdeskConfig;
  onSaveConfig: (newConfig: HelpdeskConfig) => void;
}

export const AdminHelpdeskControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [isGlobalChatActive, setIsGlobalChatActive] = useState<boolean>(config.isGlobalChatActive);
  const [criteria, setCriteria] = useState<HelpdeskCriterion[]>(config.criteria);

  // New criterion form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newSupportEmail, setNewSupportEmail] = useState<string>('');
  const [newChatEnabled, setNewChatEnabled] = useState<boolean>(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateEmail = (id: string, email: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, supportEmail: email.trim() } : c))
    );
  };

  const handleToggleChat = (id: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, chatEnabled: !c.chatEnabled } : c))
    );
  };

  const handleDeleteCriterion = (id: string) => {
    if (criteria.length <= 1) {
      setSaveNotice('At least one helpdesk criterion must remain configured.');
      setTimeout(() => setSaveNotice(null), 3000);
      return;
    }
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newSupportEmail.trim()) return;

    const newCrit: HelpdeskCriterion = {
      id: `crit-${Date.now().toString().slice(-4)}`,
      category: newCategory.trim(),
      description: newDescription.trim() || 'General inquiries and support assistance.',
      supportEmail: newSupportEmail.trim(),
      chatEnabled: newChatEnabled,
      typicalResponseTime: 'Within 24 hours',
    };

    setCriteria((prev) => [...prev, newCrit]);
    setNewCategory('');
    setNewDescription('');
    setNewSupportEmail('');
    setShowAddForm(false);
  };

  const handleSave = () => {
    const updated: HelpdeskConfig = {
      isGlobalChatActive,
      criteria,
    };
    onSaveConfig(updated);
    setSaveNotice('Helpdesk configurations and support mail endpoints updated successfully!');
    setTimeout(() => {
      setSaveNotice(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-400/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Admin Helpdesk & Email Configuration</h3>
              <p className="text-[11px] text-slate-400">
                Activate/deactivate chat mode and assign dedicated support emails per criteria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {saveNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveNotice}</span>
            </div>
          )}

          {/* Master Chat Mode Switch */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Global Live Chat System</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Master switch to activate or deactivate real-time chat for all students and staff users
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsGlobalChatActive(!isGlobalChatActive)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isGlobalChatActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isGlobalChatActive ? 'Chat Mode: Active' : 'Chat Mode: Deactivated'}</span>
            </button>
          </div>

          {/* Criteria & Specific Mail IDs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Criteria & Designated Support Mails</h4>
                <p className="text-[11px] text-slate-500">
                  Assign separate, dedicated email addresses for different helpdesk criteria
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>
            </div>

            {/* Add Criterion Form */}
            {showAddForm && (
              <form onSubmit={handleAddCriterion} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <h5 className="font-bold text-indigo-900">New Helpdesk Category & Email Endpoint</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sports & Cultural Affairs"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Designated Support Mail ID *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. sports.office@rlsycollege.ac.in"
                      value={newSupportEmail}
                      onChange={(e) => setNewSupportEmail(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of matters handled under this criterion..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newChatEnabled}
                      onChange={(e) => setNewChatEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enable Live Chat for this criterion</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="py-1.5 px-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                    >
                      Save Criterion
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Existing Criteria List */}
            <div className="space-y-3">
              {criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{crit.category}</span>
                      <span className="text-[11px] text-slate-500">{crit.description}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleChat(crit.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          crit.chatEnabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Toggle live chat for this specific criterion"
                      >
                        {crit.chatEnabled ? 'Chat: Enabled' : 'Chat: Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCriterion(crit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="Delete criterion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dedicated Mail ID Input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 shrink-0">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dedicated Mail ID:</span>
                    </span>
                    <input
                      type="email"
                      value={crit.supportEmail}
                      onChange={(e) => handleUpdateEmail(crit.id, e.target.value)}
                      placeholder="e.g. support@rlsycollege.ac.in"
                      className="flex-1 p-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-indigo-900 focus:bg-white focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Changes will take effect immediately across all student and staff portals.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Helpdesk Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
