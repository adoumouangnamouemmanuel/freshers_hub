"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle2, Edit2 } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import {
  getAcademicYearsAction,
  createAcademicYearAction,
  updateAcademicYearAction,
  activateAcademicYearAction,
} from "@/app/actions/academicYears";

type AcademicYear = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export default function AcademicYearsPage() {
  const [cycles, setCycles] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({ label: "", start_date: "", end_date: "" });

  const fetchCycles = async () => {
    try {
      const data = await getAcademicYearsAction();
      setCycles(data);
    } catch (error) {
      console.error("Failed to fetch academic years", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        await updateAcademicYearAction(editingCycle.id, formData);
      } else {
        await createAcademicYearAction(formData);
      }
      setShowModal(false);
      setEditingCycle(null);
      setFormData({ label: "", start_date: "", end_date: "" });
      fetchCycles();
    } catch (error) {
      console.error("Failed to save cycle", error);
      alert("Failed to save. Make sure end date is after start date.");
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm("Are you sure you want to activate this academic year? It will become the current cycle.")) return;
    try {
      await activateAcademicYearAction(id);
      fetchCycles();
    } catch (error) {
      console.error("Failed to activate cycle", error);
    }
  };

  const openEditModal = (cycle: AcademicYear) => {
    setEditingCycle(cycle);
    setFormData({
      label: cycle.label,
      start_date: new Date(cycle.start_date).toISOString().split('T')[0],
      end_date: new Date(cycle.end_date).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCycle(null);
    setFormData({ label: "", start_date: "", end_date: "" });
    setShowModal(true);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Academic Years / Cycles"
        description="Manage the one-year cycles that structure all Fresher Hub data"
        badge="Administration"
        action={
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Cycle
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><p className="text-[#6B7280]">Loading cycles...</p></div>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-3 mb-8">
            {cycles.map((cycle) => {
              const status = cycle.is_current ? "active" : (new Date(cycle.end_date) < new Date() ? "archived" : "upcoming");
              
              return (
                <AnimatedSection key={cycle.id} className={`rounded-2xl border ${cycle.is_current ? 'border-[#A93C40] bg-[#FFF5F5]' : 'bg-white'} p-5 shadow-sm hover:shadow-lg transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-lg text-[#1A2B4A]">{cycle.label}</p>
                    <StatusBadge status={status} />
                  </div>
                  
                  <div className="text-sm text-[#6B7280] mb-4">
                    {new Date(cycle.start_date).toLocaleDateString()} — {new Date(cycle.end_date).toLocaleDateString()}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#f3f4f6]">
                    <p className="font-semibold text-[#1A2B4A] text-sm">Intakes in this cycle:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-[#4B5563]">September Intake</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-[#4B5563]">January Intake</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => openEditModal(cycle)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-[#4B5563] hover:bg-gray-50 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    {!cycle.is_current && (
                      <button 
                        onClick={() => handleActivate(cycle.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#A93C40] text-white flex items-center gap-1 font-medium transition-colors hover:bg-[#8A2B2F] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Activate
                      </button>
                    )}
                  </div>
                </AnimatedSection>
              )
            })}
          </div>

          <AnimatedSection className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#f3f4f6]">
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Cycle History</h2>
            </div>
            <DataTable
              columns={[
                { key: "label", header: "Cycle", render: (c: AcademicYear) => <span className="font-semibold text-[#1A2B4A]">{c.label}</span> },
                { key: "status", header: "Status", render: (c: AcademicYear) => <StatusBadge status={c.is_current ? 'active' : (new Date(c.end_date) < new Date() ? 'archived' : 'upcoming')} /> },
                { key: "start_date", header: "Start Date", render: (c: AcademicYear) => <span className="text-[#6B7280]">{new Date(c.start_date).toLocaleDateString()}</span> },
                { key: "end_date", header: "End Date", render: (c: AcademicYear) => <span className="text-[#6B7280]">{new Date(c.end_date).toLocaleDateString()}</span> },
                { 
                  key: "actions", 
                  header: "", 
                  render: (c: AcademicYear) => (
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => openEditModal(c)} className="text-sm text-[#4B5563] font-semibold hover:underline cursor-pointer">Edit</button>
                      {!c.is_current && <button onClick={() => handleActivate(c.id)} className="text-sm text-[#A93C40] font-semibold hover:underline cursor-pointer">Activate</button>}
                    </div>
                  ) 
                },
              ]}
              data={cycles}
              keyExtractor={(c: AcademicYear) => c.id}
            />
          </AnimatedSection>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2B4A]">
                {editingCycle ? "Edit Academic Cycle" : "Create New Cycle"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-[#1A2B4A] text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">Label</label>
                <input 
                  required
                  type="text" 
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  placeholder="e.g. 2026/2027"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">Start Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">End Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#A93C40]/20 focus:border-[#A93C40] outline-none transition-all"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 px-4 rounded-xl text-[#4B5563] font-medium border border-[#D1D5DB] hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-[#A93C40] hover:bg-[#8A2B2F] transition-colors shadow-md shadow-[#A93C40]/20">
                  {editingCycle ? "Save Changes" : "Create Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}