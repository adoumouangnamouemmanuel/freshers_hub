import { SearchInput } from "@/components/ui/search-input";

interface AuditLogFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  actionFilter: string;
  setActionFilter: (s: string) => void;
  entityTypeFilter: string;
  setEntityTypeFilter: (s: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (d: { start: string; end: string }) => void;
}

export function AuditLogFilters({
  search, setSearch,
  actionFilter, setActionFilter,
  entityTypeFilter, setEntityTypeFilter,
  dateRange, setDateRange
}: AuditLogFiltersProps) {
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl border border-[#e5e1d8] shadow-sm">
      <div className="flex-1">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by actor name or email..." 
          className="w-full"
        />
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <select 
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-[#e5e1d8] px-4 py-2 bg-white text-sm font-medium text-[#1A2B4A] focus:outline-none focus:ring-1 focus:ring-[#A93C40]"
        >
          <option value="all">All Actions</option>
          <option value="user.updated">User Updated</option>
          <option value="user.created">User Created</option>
          <option value="role.assigned">Role Assigned</option>
          <option value="role.bulk_assigned">Role Bulk Assigned</option>
          <option value="role.removed">Role Removed</option>
          <option value="setting.updated">Setting Updated</option>
          <option value="admin.granted">Admin Granted</option>
          <option value="admin.revoked">Admin Revoked</option>
        </select>

        <select 
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="rounded-xl border border-[#e5e1d8] px-4 py-2 bg-white text-sm font-medium text-[#1A2B4A] focus:outline-none focus:ring-1 focus:ring-[#A93C40]"
        >
          <option value="all">All Entities</option>
          <option value="user">User</option>
          <option value="setting">Setting</option>
          <option value="academic_year">Academic Year</option>
          <option value="club">Club</option>
          <option value="office">Office</option>
        </select>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="rounded-xl border border-[#e5e1d8] px-3 py-2 bg-white text-sm text-[#1A2B4A] focus:outline-none focus:ring-1 focus:ring-[#A93C40]"
          />
          <span className="text-gray-400">to</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="rounded-xl border border-[#e5e1d8] px-3 py-2 bg-white text-sm text-[#1A2B4A] focus:outline-none focus:ring-1 focus:ring-[#A93C40]"
          />
        </div>
      </div>
    </div>
  );
}
