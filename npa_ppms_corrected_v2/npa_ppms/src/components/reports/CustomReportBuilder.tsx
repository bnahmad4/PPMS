import React, { useState, useMemo } from 'react';
import {
  Filter,
  Columns,
  Layers,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  X,
  RotateCcw,
  SlidersHorizontal,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  FileSpreadsheet
} from 'lucide-react';
import {
  ReportDataset,
  ReportFilterConfig,
  ReportTemplate,
  Port,
  CustomerCategory
} from '../../types';
import {
  DATASET_OPTIONS,
  DATASET_COLUMNS,
  filterDataset,
  groupDataset,
  GroupedReportData,
  DatasetColumnConfig
} from './reportDefinitions';
import { StatusBadge } from '../common/StatusBadge';

interface CustomReportBuilderProps {
  dataset: ReportDataset;
  onChangeDataset: (ds: ReportDataset) => void;
  rawApplications: any[];
  rawPasses: any[];
  rawCompanies: any[];
  rawAuditLogs: any[];
  ports: Port[];
  categories: CustomerCategory[];
  activeColumns: string[];
  onChangeColumns: (cols: string[]) => void;
  filterConfig: ReportFilterConfig;
  onChangeFilterConfig: (cfg: ReportFilterConfig) => void;
  groupBy: string;
  onChangeGroupBy: (group: string) => void;
  sortBy: string;
  onChangeSortBy: (colId: string) => void;
  sortDirection: 'asc' | 'desc';
  onChangeSortDirection: (dir: 'asc' | 'desc') => void;
  onOpenSaveTemplate: () => void;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  dataset,
  onChangeDataset,
  rawApplications,
  rawPasses,
  rawCompanies,
  rawAuditLogs,
  ports,
  categories,
  activeColumns,
  onChangeColumns,
  filterConfig,
  onChangeFilterConfig,
  groupBy,
  onChangeGroupBy,
  sortBy,
  onChangeSortBy,
  sortDirection,
  onChangeSortDirection,
  onOpenSaveTemplate
}) => {
  const [showColumnDrawer, setShowColumnDrawer] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Resolve dataset items based on selected dataset
  const datasetItems = useMemo(() => {
    switch (dataset) {
      case 'APPLICATIONS':
        return rawApplications;
      case 'FINANCIAL_BILLING':
        // Applications that have a bill or payment, plus raw applications
        return rawApplications.filter(a => a.bill || a.payment || a.status === 'PAYMENT_UNDER_REVIEW');
      case 'PASSES_BIOMETRICS':
        return rawPasses.length > 0 ? rawPasses : rawApplications.flatMap(a => a.employees?.map((e: any) => ({
          serialNumber: e.passNumber || `NPA-PASS-${e.id.substring(0, 6).toUpperCase()}`,
          employeeName: e.fullName,
          companyName: a.companyName,
          portName: a.portName,
          passTypeName: a.passTypeName,
          zoneAccess: 'ZONES 1, 2, 3 (ALL QUAYS)',
          status: a.status === 'COLLECTED' ? 'ACTIVE' : (a.status === 'PASS_READY_FOR_COLLECTION' ? 'READY' : 'PENDING'),
          issuedAt: a.updatedAt || a.submittedAt,
          expiresAt: '2027-10-01'
        })) || []);
      case 'COMPANIES_AUDIT':
        return rawCompanies.map(c => {
          const compApps = rawApplications.filter(a => a.companyId === c.id || a.companyName === c.companyName);
          const totalStaff = compApps.reduce((s, a) => s + (a.numberOfEmployees || a.employees?.length || 1), 0);
          const totalBilled = compApps.reduce((s, a) => s + (a.bill?.amountNgn || 0), 0);
          const totalPaid = compApps.reduce((s, a) => s + (a.payment?.verificationStatus === 'CONFIRMED' ? (a.bill?.amountNgn || 0) : 0), 0);
          return {
            ...c,
            totalApplications: compApps.length,
            totalActivePasses: totalStaff,
            totalBilledNgn: totalBilled,
            totalPaidNgn: totalPaid,
            categoryName: compApps[0]?.categoryName || 'Port Concessionaire'
          };
        });
      case 'SECURITY_CLEARANCE':
        return rawApplications;
      case 'AUDIT_LOGS':
        return rawAuditLogs;
      default:
        return rawApplications;
    }
  }, [dataset, rawApplications, rawPasses, rawCompanies, rawAuditLogs]);

  // Available column definitions for the active dataset
  const availableColumns = useMemo(() => {
    return DATASET_COLUMNS[dataset] || DATASET_COLUMNS.APPLICATIONS;
  }, [dataset]);

  // Apply multi-parameter filtering
  const filteredItems = useMemo(() => {
    return filterDataset(datasetItems, filterConfig, dataset);
  }, [datasetItems, filterConfig, dataset]);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems;
    const colDef = availableColumns.find(c => c.id === sortBy);
    if (!colDef) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const valA = colDef.getValue(a);
      const valB = colDef.getValue(b);

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortBy, sortDirection, availableColumns]);

  // Group items if groupBy is specified
  const groupedData: GroupedReportData[] = useMemo(() => {
    return groupDataset(sortedItems, groupBy);
  }, [sortedItems, groupBy]);

  // Total metrics across filtered items
  const totalAmountNgn = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.bill?.amountNgn || item.amountNgn || 0), 0);
  }, [filteredItems]);

  const totalEmployees = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.numberOfEmployees || item.employees?.length || 1), 0);
  }, [filteredItems]);

  // Handle column toggle
  const toggleColumn = (colId: string) => {
    if (activeColumns.includes(colId)) {
      if (activeColumns.length <= 1) return; // Prevent removing all columns
      onChangeColumns(activeColumns.filter(id => id !== colId));
    } else {
      onChangeColumns([...activeColumns, colId]);
    }
  };

  const handleSelectAllColumns = () => {
    onChangeColumns(availableColumns.map(c => c.id));
  };

  const handleResetDefaultColumns = () => {
    onChangeColumns(availableColumns.filter(c => c.defaultVisible).map(c => c.id));
  };

  const handleSortClick = (colId: string) => {
    if (sortBy === colId) {
      onChangeSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onChangeSortBy(colId);
      onChangeSortDirection('asc');
    }
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Cell renderer helper
  const renderCell = (col: DatasetColumnConfig, item: any) => {
    const val = col.getValue(item);
    if (val == null || val === '') return <span className="text-slate-400 font-mono">-</span>;

    if (col.format === 'currency') {
      return (
        <span className="font-mono font-bold text-slate-900">
          NGN {Number(val).toLocaleString()}
        </span>
      );
    }

    if (col.format === 'number') {
      return <span className="font-mono font-bold text-slate-800">{Number(val).toLocaleString()}</span>;
    }

    if (col.format === 'date') {
      try {
        const d = new Date(val);
        return <span className="font-mono text-slate-700">{isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-NG')}</span>;
      } catch {
        return <span className="font-mono text-slate-700">{String(val)}</span>;
      }
    }

    if (col.format === 'datetime') {
      try {
        const d = new Date(val);
        return <span className="font-mono text-[11px] text-slate-600">{isNaN(d.getTime()) ? String(val) : d.toLocaleString('en-NG')}</span>;
      } catch {
        return <span className="font-mono text-slate-700">{String(val)}</span>;
      }
    }

    if (col.format === 'badge') {
      const strVal = String(val);
      if (['CONFIRMED', 'SECURITY_CLEARED', 'ACTIVE', 'COLLECTED'].includes(strVal)) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase font-mono">
            {strVal.replace(/_/g, ' ')}
          </span>
        );
      }
      if (['PENDING', 'AWAITING_PAYMENT', 'VETTING_IN_PROGRESS', 'PENDING_ID_UNIT_VERIFICATION', 'SECURITY_REVIEW_PENDING'].includes(strVal)) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase font-mono">
            {strVal.replace(/_/g, ' ')}
          </span>
        );
      }
      if (['PAYMENT_UNDER_REVIEW', 'CAPTURING_SCHEDULED', 'PASS_READY_FOR_COLLECTION'].includes(strVal)) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase font-mono">
            {strVal.replace(/_/g, ' ')}
          </span>
        );
      }
      if (['REJECTED', 'SECURITY_DENIED', 'CANCELLED', 'SUSPENDED'].includes(strVal)) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 uppercase font-mono">
            {strVal.replace(/_/g, ' ')}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase font-mono">
          {strVal.replace(/_/g, ' ')}
        </span>
      );
    }

    return <span className="text-slate-800 font-medium">{String(val)}</span>;
  };

  // Group columns by category for the Column Drawer
  const columnsByCategory = useMemo(() => {
    const grouped: Record<string, DatasetColumnConfig[]> = {};
    availableColumns.forEach(c => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    });
    return grouped;
  }, [availableColumns]);

  return (
    <div className="space-y-4">
      {/* Dataset Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          1. Select Primary Reporting Dataset:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {DATASET_OPTIONS.map(opt => {
            const isSelected = dataset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChangeDataset(opt.id);
                  onChangeFilterConfig({ ...filterConfig, dataset: opt.id });
                  const defCols = (DATASET_COLUMNS[opt.id] || []).filter(c => c.defaultVisible).map(c => c.id);
                  onChangeColumns(defCols);
                }}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#087443] bg-emerald-50/50 shadow-2xs ring-1 ring-[#087443]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">{opt.label}</div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{opt.description}</p>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold text-[#087443] font-mono mt-2 block">
                    ● Active Dataset
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-48 flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, company, RRR..."
                value={filterConfig.searchTerm || ''}
                onChange={e => onChangeFilterConfig({ ...filterConfig, searchTerm: e.target.value })}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#087443] outline-hidden"
              />
              {filterConfig.searchTerm && (
                <button
                  onClick={() => onChangeFilterConfig({ ...filterConfig, searchTerm: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Port selector */}
            <select
              value={filterConfig.portId || 'ALL'}
              onChange={e => onChangeFilterConfig({ ...filterConfig, portId: e.target.value })}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium"
            >
              <option value="ALL">All NPA Port Complexes</option>
              {ports.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Date Preset */}
            <select
              value={filterConfig.dateRangePreset || 'ALL'}
              onChange={e => onChangeFilterConfig({ ...filterConfig, dateRangePreset: e.target.value as any })}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="YEAR_TO_DATE">Year to Date</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>

            {/* Group By selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px] font-mono">GROUP:</span>
              <select
                value={groupBy || 'NONE'}
                onChange={e => onChangeGroupBy(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium"
              >
                <option value="NONE">No Grouping (Flat)</option>
                <option value="portName">By Port Complex</option>
                <option value="status">By Workflow Status</option>
                <option value="categoryName">By Category</option>
                <option value="paymentStatus">By Payment Verification</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-emerald-50 text-[#087443] border-[#087443]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Columns Drawer Trigger */}
            <button
              onClick={() => setShowColumnDrawer(!showColumnDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                showColumnDrawer
                  ? 'bg-emerald-50 text-[#087443] border-[#087443]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Columns ({activeColumns.length})</span>
            </button>

            {/* Save View as Template */}
            <button
              onClick={onOpenSaveTemplate}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save as Template</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
            {/* Payment Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Verification</label>
              <select
                value={filterConfig.paymentStatus || 'ALL'}
                onChange={e => onChangeFilterConfig({ ...filterConfig, paymentStatus: e.target.value as any })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="CONFIRMED">TSA Cleared (Confirmed)</option>
                <option value="UNDER_REVIEW">Payment Under Review</option>
                <option value="PENDING">Pending Payment / Unpaid</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Category</label>
              <select
                value={filterConfig.categoryId || 'ALL'}
                onChange={e => onChangeFilterConfig({ ...filterConfig, categoryId: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
              >
                <option value="ALL">All Concession Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Custom Date Inputs if CUSTOM */}
            {filterConfig.dateRangePreset === 'CUSTOM' ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filterConfig.startDate || ''}
                    onChange={e => onChangeFilterConfig({ ...filterConfig, startDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filterConfig.endDate || ''}
                    onChange={e => onChangeFilterConfig({ ...filterConfig, endDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Date Field</label>
                <select
                  value={filterConfig.dateField || 'submittedAt'}
                  onChange={e => onChangeFilterConfig({ ...filterConfig, dateField: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                >
                  <option value="submittedAt">Submission Date</option>
                  <option value="createdAt">Dossier Creation Date</option>
                  <option value="updatedAt">Latest Stage Update</option>
                </select>
              </div>
            )}

            {/* Reset Filters button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onChangeFilterConfig({ dataset })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Column Selector Modal / Drawer */}
        {showColumnDrawer && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Columns className="w-4 h-4 text-[#087443]" />
                <span className="font-bold text-xs text-slate-800">
                  Visible Column Fields for {DATASET_OPTIONS.find(d => d.id === dataset)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded-sm hover:bg-slate-200"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleResetDefaultColumns}
                  className="text-[11px] font-bold text-[#087443] hover:underline px-2 py-0.5"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => setShowColumnDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(columnsByCategory).map(([catName, cols]) => (
                <div key={catName} className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    {catName}
                  </div>
                  <div className="space-y-1">
                    {cols.map(c => {
                      const isChecked = activeColumns.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(c.id)}
                            className="rounded text-[#087443] focus:ring-[#087443] w-3.5 h-3.5"
                          />
                          <span className={isChecked ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                            {c.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Header Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900 font-mono">{filteredItems.length}</strong> records
          </span>
          {totalAmountNgn > 0 && (
            <span>
              • Total Amount: <strong className="text-[#087443] font-mono">NGN {totalAmountNgn.toLocaleString()}</strong>
            </span>
          )}
          {totalEmployees > 0 && (
            <span>
              • Staff Headcount: <strong className="text-slate-800 font-mono">{totalEmployees.toLocaleString()}</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Sort: <strong className="text-slate-700">{sortBy || 'Default'}</strong> ({sortDirection.toUpperCase()})</span>
        </div>
      </div>

      {/* Main Interactive Table / Grouped Views */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {groupedData.length === 0 || (groupedData.length === 1 && groupedData[0].items.length === 0) ? (
          <div className="p-12 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Records Match Active Filters</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your date range, port selection, payment status, or search keywords.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {groupedData.map(group => {
              const isCollapsed = collapsedGroups[group.groupKey];
              const isGroupedView = groupBy && groupBy !== 'NONE';

              return (
                <div key={group.groupKey} className="border-b last:border-b-0 border-slate-200">
                  {/* Group header if grouped */}
                  {isGroupedView && (
                    <div
                      onClick={() => toggleGroupCollapse(group.groupKey)}
                      className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer border-b border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          {group.groupLabel}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          {group.totalCount} items
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        {group.totalAmountNgn > 0 && (
                          <span className="text-[#087443] font-bold">
                            Subtotal: NGN {group.totalAmountNgn.toLocaleString()}
                          </span>
                        )}
                        <span className="text-slate-500">
                          Personnel: {group.totalEmployees}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Group Items Table */}
                  {!isCollapsed && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          {availableColumns
                            .filter(c => activeColumns.includes(c.id))
                            .map(col => {
                              const isSorted = sortBy === col.id;
                              return (
                                <th
                                  key={col.id}
                                  onClick={() => handleSortClick(col.id)}
                                  className={`py-2.5 px-3 cursor-pointer hover:bg-slate-200/80 select-none transition-colors ${
                                    col.align === 'right' ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                    <span>{col.label}</span>
                                    {isSorted ? (
                                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#087443]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#087443]" />
                                    ) : (
                                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            {availableColumns
                              .filter(c => activeColumns.includes(c.id))
                              .map(col => (
                                <td
                                  key={col.id}
                                  className={`py-2.5 px-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                                >
                                  {renderCell(col, item)}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
