"use client";

import { useState } from "react";
import { LifeBuoy, Plus, Phone, Mail, MapPin, Edit3, Trash2 } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "@/components/ui/animated-container";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";

const offices = [
  { id: "1", name: "ODIP", description: "Office of Diversity and International Programs", email: "odip@ashesi.edu.gh", phone: "+233 50 404 5050", location: "ODIP Office, Ground Floor", staff: 3 },
  { id: "2", name: "SLE", description: "Student Life and Engagement", email: "sle@ashesi.edu.gh", phone: "+233 50 303 4040", location: "Student Center", staff: 5 },
  { id: "3", name: "IT Support", description: "Information Technology Services", email: "helpdesk@ashesi.edu.gh", phone: "+233 50 202 3030", location: "IT Building", staff: 4 },
  { id: "4", name: "Health Center", description: "Campus Health Services", email: "health@ashesi.edu.gh", phone: "+233 50 101 2020", location: "Health Center", staff: 2 },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const filtered = offices.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatedPage>
      <PageHeader
        title="Help Center / Offices"
        description="Manage the offices, contact info, and staff that power the mobile Help Center"
        badge="Content"
        action={
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A93C40] text-white text-sm font-semibold hover:bg-[#A93C40]/90 transition-colors shadow-md shadow-[#A93C40]/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Office
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search offices..." />

      <DataTable
        columns={[
          { key: "name", header: "Office", render: (o: any) => (
            <div>
              <p className="font-semibold text-[#1A2B4A]">{o.name}</p>
              <p className="text-xs text-[#6B7280]">{o.description}</p>
            </div>
          )},
          { key: "contact", header: "Contact", render: (o: any) => (
            <div className="space-y-0.5">
              <span className="flex items-center gap-1.5 text-xs text-[#6B7280]"><Mail className="w-3 h-3" />{o.email}</span>
              <span className="flex items-center gap-1.5 text-xs text-[#6B7280]"><Phone className="w-3 h-3" />{o.phone}</span>
            </div>
          )},
          { key: "location", header: "Location", render: (o: any) => (
            <span className="flex items-center gap-1.5 text-sm text-[#6B7280]"><MapPin className="w-3.5 h-3.5" />{o.location}</span>
          )},
          { key: "staff", header: "Staff", render: (o: any) => <span className="font-medium text-[#1A2B4A]">{o.staff} assigned</span> },
          { key: "actions", header: "", render: (o: any) => (
            <div className="flex gap-2">
              <button className="p-2 rounded-lg text-[#6B7280] hover:text-[#A93C40] hover:bg-[#A93C40]/5 transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          )},
        ]}
        data={filtered}
        keyExtractor={(o: any) => o.id}
      />
    </AnimatedPage>
  );
}