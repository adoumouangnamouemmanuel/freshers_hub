import React, { useState } from "react";
import { ChevronDown, ChevronRight, User, Settings, ShieldAlert, Key } from "lucide-react";
import { format } from "date-fns";

interface AuditLogTableProps {
  data: any[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  total: number;
}

export function AuditLogTable({ data, page, totalPages, onPageChange, total }: AuditLogTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("assigned") || action.includes("granted")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (action.includes("removed") || action.includes("revoked") || action.includes("deleted")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (action.includes("updated") || action.includes("bulk")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getEntityIcon = (entityType: string) => {
    switch(entityType) {
      case "user": return <User className="w-4 h-4" />;
      case "setting": return <Settings className="w-4 h-4" />;
      case "role": return <Key className="w-4 h-4" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e1d8] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e1d8] bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e1d8]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No audit logs found matching your criteria.
                </td>
              </tr>
            ) : data.map((log) => (
              <React.Fragment key={log.id}>
                <tr 
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-gray-50' : ''}`}
                  onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                >
                  <td className="px-6 py-4 text-gray-400">
                    {expandedRow === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#1A2B4A]">{log.actor_name || 'System'}</span>
                      <span className="text-xs text-gray-500">{log.actor_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 capitalize">
                      {getEntityIcon(log.entity_type)}
                      {log.entity_type.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                  </td>
                </tr>
                {expandedRow === log.id && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50/80 border-t border-dashed border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Event Details</h4>
                          <ul className="space-y-1 text-gray-600">
                            <li><span className="font-medium">Log ID:</span> {log.id}</li>
                            <li><span className="font-medium">IP Address:</span> {log.ip_address || 'N/A'}</li>
                            <li><span className="font-medium">Target Entity ID:</span> {log.entity_id || 'N/A'}</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Metadata payload</h4>
                          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                            <pre className="text-xs text-green-400 font-mono">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-[#e5e1d8] flex items-center justify-between bg-gray-50/50">
        <span className="text-sm text-gray-500">
          Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, total)}</span> of <span className="font-medium">{total}</span> logs
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-sm font-medium border border-[#e5e1d8] rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-[#1A2B4A]"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || totalPages === 0}
            className="px-3 py-1 text-sm font-medium border border-[#e5e1d8] rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-[#1A2B4A]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
