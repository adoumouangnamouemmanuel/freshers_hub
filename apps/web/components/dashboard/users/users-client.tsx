"use client";

import { useState, useEffect, useTransition } from "react";
import { UserPlus, Upload, Loader2 } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { UsersFilters } from "./users-filters";
import { UsersTable } from "./users-table";
import { UsersBulkActions } from "./users-bulk-actions";
import { getUsersAction, deactivateUsersAction, assignRolesAction } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import { AddUserModal } from "./add-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { ImportCohortModal } from "./import-cohort-modal";

interface UsersClientProps {
  initialData: { data: any[]; total: number; page: number; pageSize: number };
  allRoles: { id: string; name: string }[];
}

export default function UsersClient({ initialData, allRoles }: UsersClientProps) {
  const router = useRouter();
  
  const [users, setUsers] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  async function refetch() {
    const res = await getUsersAction({ search, role: roleFilter, status: statusFilter });
    setUsers(res.data || []);
    setTotal(res.total || 0);
    router.refresh();
  }

  // Debounce search and refetch
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          await refetch();
          setSelected(new Set());
        } catch (error) {
          console.error("Failed to fetch users", error);
        }
      });
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

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

  async function handleDeactivate() {
    await deactivateUsersAction(Array.from(selected));
    await refetch();
  }

  async function handleAssignRole(roleId: string) {
    await assignRolesAction(Array.from(selected), roleId);
    await refetch();
  }

  async function handleDeactivateSingle(id: string) {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    await deactivateUsersAction([id]);
    await refetch();
  }

  return (
    <AnimatedPage>
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
        allRoles={allRoles}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          Showing <span className="font-semibold text-[#1A2B4A]">{users.length}</span> of{" "}
          <span className="font-semibold text-[#1A2B4A]">{total}</span> accounts
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
      />

      <UsersBulkActions
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        onDeactivate={handleDeactivate}
        onAssignRole={handleAssignRole}
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
    </AnimatedPage>
  );
}
