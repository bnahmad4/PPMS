import React, { useState } from 'react';
import {
  Bookmark,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  FolderOpen,
  Filter,
  Columns,
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ReportTemplate, ReportFilterConfig, ReportDataset } from '../../types';
import { api } from '../../api/client';

interface ReportTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ReportTemplate[];
  activeTemplateId?: string;
  onApplyTemplate: (template: ReportTemplate) => void;
  onRefreshTemplates: () => void;
  currentConfig?: {
    name?: string;
    dataset: ReportDataset;
    selectedColumns: string[];
    filters: ReportFilterConfig;
    groupBy?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  };
}

export const ReportTemplatesModal: React.FC<ReportTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  activeTemplateId,
  onApplyTemplate,
  onRefreshTemplates,
  currentConfig
}) => {
  const [mode, setMode] = useState<'LIST' | 'SAVE_NEW'>('LIST');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Executive Management');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    return true;
  });

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFeedback({ type: 'error', text: 'Template name is required' });
      return;
    }
    if (!currentConfig) {
      setFeedback({ type: 'error', text: 'No active report configuration to save' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const res = await api.createReportTemplate({
        name: newTitle.trim(),
        description: newDescription.trim() || 'Custom report configuration',
        category: newCategory,
        dataset: currentConfig.dataset,
        selectedColumns: currentConfig.selectedColumns,
        filters: currentConfig.filters,
        groupBy: currentConfig.groupBy,
        sortBy: currentConfig.sortBy,
        sortDirection: currentConfig.sortDirection
      });

      if (res.success) {
        onRefreshTemplates();
        onApplyTemplate(res.template);
        setMode('LIST');
        setFeedback({ type: 'success', text: `Template "${res.template.name}" saved successfully!` });
        setNewTitle('');
        setNewDescription('');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.deleteReportTemplate(id);
      onRefreshTemplates();
      setFeedback({ type: 'success', text: `Template "${name}" deleted.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to delete template.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#087443] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Saved Report Templates</h3>
              <p className="text-xs text-white/80">Load official NPA reporting standards or customized user layouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'LIST' ? (
              <button
                onClick={() => {
                  setMode('SAVE_NEW');
                  setNewTitle(currentConfig?.name ? `${currentConfig.name} (Custom)` : 'Custom Port Report');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#087443] hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Active View as Template
              </button>
            ) : (
              <button
                onClick={() => setMode('LIST')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Templates
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`p-3 text-xs flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span className="font-semibold">{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="cursor-pointer hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        {mode === 'LIST' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#087443] text-white border-[#087443] font-bold shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Template list */}
            <div className="grid grid-cols-1 gap-3">
              {filteredTemplates.map(tpl => {
                const isActive = activeTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-[#087443] bg-emerald-50/40 ring-1 ring-[#087443]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 uppercase tracking-wider font-mono">
                            {tpl.category}
                          </span>
                          {tpl.isPredefined && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-100 text-[#087443] uppercase tracking-wider">
                              Official NPA Standard
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{tpl.name}</h4>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{tpl.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onApplyTemplate(tpl);
                            onClose();
                          }}
                          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                            isActive
                              ? 'bg-[#087443] text-white hover:bg-[#065C35]'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Active' : 'Apply Layout'}</span>
                        </button>

                        {!tpl.isPredefined && (
                          <button
                            onClick={() => handleDelete(tpl.id, tpl.name)}
                            title="Delete template"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Columns className="w-3.5 h-3.5 text-slate-400" />
                        {tpl.selectedColumns.length} Columns
                      </span>
                      {tpl.groupBy && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Grouped by: <span className="font-semibold text-slate-700">{tpl.groupBy}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        Dataset: <span className="font-semibold text-slate-700">{tpl.dataset}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveNew} className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Remita Reconciliation Summary"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443] focus:border-transparent outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
              >
                <option value="Executive Management">Executive Management</option>
                <option value="Finance & Treasury">Finance & Treasury</option>
                <option value="Operations">Operations</option>
                <option value="Security">Security</option>
                <option value="Compliance">Compliance</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what this report configuration shows..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443] focus:border-transparent outline-hidden resize-none"
              />
            </div>

            {/* Current configuration preview */}
            {currentConfig && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider font-mono">
                  Active Configuration to Persist:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                  <div><strong>Target Dataset:</strong> {currentConfig.dataset}</div>
                  <div><strong>Selected Columns:</strong> {currentConfig.selectedColumns.length} fields</div>
                  <div><strong>Group By:</strong> {currentConfig.groupBy || 'None'}</div>
                  <div><strong>Sort Column:</strong> {currentConfig.sortBy || 'Default'}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMode('LIST')}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#087443] hover:bg-[#065C35] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Template'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
