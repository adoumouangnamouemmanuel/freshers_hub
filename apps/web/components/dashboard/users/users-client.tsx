"use client";

import { useState, useEffect, useTransition } from "react";
import { UserPlus, Upload, Loader2 } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { UsersFilters } from "./users-filters";
import { UsersTable } from "./users-table";
import { UsersBulkActions } from "./users-bulk-actions";
import { getUsersAction, deactivateUsersAction, assignRolesAction, getUserByIdAction } from "@/app/actions/users";
import { useRouter, useSearchParams } from "next/navigation";
import { AddUserModal } from "./add-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { ImportCohortModal } from "./import-cohort-modal";
import { ConfirmModal } from "./confirm-modal";
import { ViewUserModal } from "./view-user-modal";

interface UsersClientProps {
  initialData: { data: any[]; total: number; page: number; pageSize: number };
  allRoles: { id: string; name: string }[];
  overview?: any;
}

export default function UsersClient({ initialData, allRoles, overview }: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classYearFilter, setClassYearFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [page, setPage] = useState(initialData.page || 1);
  const pageSize = initialData.pageSize || 20;
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);

  useEffect(() => {
    const viewUserId = searchParams.get("viewUser");
    if (viewUserId) {
      getUserByIdAction(viewUserId).then(user => {
        if (user) setViewingUser(user);
        
        // Clean up URL
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("viewUser");
        router.replace(`?${newParams.toString()}`);
      }).catch(console.error);
    }
  }, [searchParams, router]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "warning" | "danger" | "info" | "success";
    isAlert: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "warning",
    isAlert: false,
    onConfirm: () => {},
  });

  function closeConfirm() {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }

  async function refetch(currentPage = page) {
    const res = await getUsersAction({ search, role: roleFilter, status: statusFilter, classYear: classYearFilter, page: currentPage, pageSize });
    setUsers(res.data || []);
    setTotal(res.total || 0);
    setPage(res.page || 1);
    router.refresh();
  }

  // Debounce search and refetch on filter change
  useEffect(() => {
    setPage(1); // Reset to page 1 on filter change
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          await refetch(1);
          setSelected(new Set());
        } catch (error) {
          console.error("Failed to fetch users", error);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter, classYearFilter]);

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > Math.ceil(total / pageSize)) return;
    startTransition(async () => {
      try {
        await refetch(newPage);
        setSelected(new Set());
      } catch (error) {
        console.error("Failed to paginate", error);
      }
    });
  }

  const allVisibleSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  function toggleAll() {
    setSelected((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set(users.map((u) => u.id));
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }


  function handleDeactivateSingle(id: string) {
    setConfirmModal({
      isOpen: true,
      title: "Deactivate User",
      description: "Are you sure you want to deactivate this user? They will lose access to the platform.",
      type: "danger",
      isAlert: false,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deactivateUsersAction([id]);
            await refetch();
            closeConfirm();
          } catch (error: any) {
            setConfirmModal({
              isOpen: true,
              title: "Error",
              description: error.message || "Failed to deactivate user",
              type: "danger",
              isAlert: true,
              onConfirm: closeConfirm
            });
          }
        });
      },
    });
  }

  // Calculate role breakdown for the progress bar
  const usersStats = overview?.users || { total_users: 0, total_students: 0, total_coaches: 0, inactive_users: 0 };
  const adminCount = Math.max(0, usersStats.total_users - (usersStats.total_students + usersStats.total_coaches));
  const studentPct = usersStats.total_users > 0 ? (usersStats.total_students / usersStats.total_users) * 100 : 0;
  const coachPct = usersStats.total_users > 0 ? (usersStats.total_coaches / usersStats.total_users) * 100 : 0;
  const adminPct = usersStats.total_users > 0 ? (adminCount / usersStats.total_users) * 100 : 0;

  return (
    <AnimatedPage>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        type={confirmModal.type}
        isAlert={confirmModal.isAlert}
        isLoading={isPending}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
      <PageHeader
        title="Users & Roles"
        description="Manage accounts, roles, and access across the platform"
        badge="Administration"
        action={
          <div className="flex gap-3">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e5e1d8] px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#f8f4ef]">
              <Upload className="h-4 w-4" /> Import cohort
            </button>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#A93C40] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#A93C40]/20 transition-colors hover:bg-[#8f3236]">
              <UserPlus className="h-4 w-4" /> Add user
            </button>
          </div>
        }
      />

      <UsersFilters
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        classYearFilter={classYearFilter}
        setClassYearFilter={setClassYearFilter}
        allRoles={allRoles}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      <AnimatedSection className="mb-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-[#eee8df] bg-[#f8f4ef]/30 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-[#1A2B4A]">Platform Roles</span>
            <span className="text-[#6B7280]">Total Users: {usersStats.total_users}</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div style={{ width: `${studentPct}%` }} className="bg-blue-500 transition-all duration-1000" title="Students" />
            <div style={{ width: `${coachPct}%` }} className="bg-orange-500 transition-all duration-1000" title="Coaches" />
            <div style={{ width: `${adminPct}%` }} className="bg-purple-500 transition-all duration-1000" title="Admins" />
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-[#6B7280]">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500"/> Students ({usersStats.total_students})</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-orange-500"/> Coaches ({usersStats.total_coaches})</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-purple-500"/> Admins ({adminCount})</div>
          </div>
        </div>
      </AnimatedSection>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          Showing page <span className="font-semibold text-[#1A2B4A]">{page}</span> of{" "}
          <span className="font-semibold text-[#1A2B4A]">{Math.ceil(total / pageSize) || 1}</span>
          {isPending && <Loader2 className="inline ml-2 h-4 w-4 animate-spin text-[#9CA3AF]" />}
        </p>
        {selected.size > 0 && (
          <p className="text-sm font-semibold text-[#A93C40]">
            {selected.size} selected
          </p>
        )}
      </div>

      <UsersTable
        users={users}
        selected={selected}
        toggleOne={toggleOne}
        toggleAll={toggleAll}
        allVisibleSelected={allVisibleSelected}
        onDeactivateUser={handleDeactivateSingle}
        onEditUser={(u) => setEditingUser(u)}
        onViewUser={(u) => setViewingUser(u)}
      />

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#eee8df] bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-[#6B7280]">
            Total: <span className="font-semibold text-[#1A2B4A]">{total}</span> accounts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isPending}
              className="rounded-lg border border-[#e5e1d8] px-3 py-1.5 text-sm font-semibold text-[#6B7280] hover:bg-[#f8f4ef] disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <div className="flex items-center justify-center rounded-lg bg-[#f8f4ef] px-3 py-1.5 text-sm font-semibold text-[#1A2B4A] min-w-[2.5rem]">
              {page}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(total / pageSize) || isPending}
              className="rounded-lg border border-[#e5e1d8] px-3 py-1.5 text-sm font-semibold text-[#6B7280] hover:bg-[#f8f4ef] disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <UsersBulkActions
        selectedUserIds={selected}
        onClearSelection={() => setSelected(new Set())}
        onSuccess={refetch}
        allRoles={allRoles}
      />

      <AddUserModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={refetch} 
        allRoles={allRoles}
      />
      
      <EditUserModal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        onSuccess={refetch} 
        user={editingUser} 
        allRoles={allRoles}
      />
      
      <ImportCohortModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={refetch} 
      />

      <ViewUserModal 
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
      />
    </AnimatedPage>
  );
}
