"use client";

import { useState, useEffect } from "react";
import {
  Search, Shield, CheckCircle2, AlertTriangle, Users,
  Eye, Phone, Mail, FileText, X
} from "lucide-react";

interface Lead {
  id: string;
  timestamp: string;
  leadType: "Service Request" | "Provider Verification" | "Seeker Verification";
  seekerName: string;
  seekerPhone: string;
  seekerEmail: string;
  vendorName: string;
  category: string;
  action: string;
  status: "Pending Assignment" | "Claimed" | "Verified" | "Rejected" | "Paid" | "Two-Way Confirmed";
  assignedCoordinator?: string;
  requestedDetails?: any;
}

export default function CoordinatorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "requests" | "providers" | "seekers">("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Load leads from localStorage
  const loadLeads = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("demandgenius_leads");
      if (stored) {
        // Map old format to new format if needed
        const parsed = JSON.parse(stored).map((l: any) => ({
          id: l.id || Math.random().toString(36).substring(2, 9),
          timestamp: l.timestamp || new Date().toISOString(),
          leadType: l.leadType || (l.category.includes("Verification") ? (l.category.includes("Provider") ? "Provider Verification" : "Seeker Verification") : "Service Request"),
          seekerName: l.seekerName || "Guest User",
          seekerPhone: l.seekerPhone || l.phone || "+91 98841 66603",
          seekerEmail: l.seekerEmail || l.email || "guest@demandgenius.com",
          vendorName: l.vendorName || "Unknown Vendor",
          category: l.category || "Service",
          action: l.action || l.actionDetails || "Inquiry placed",
          status: l.status || "Pending Assignment",
          assignedCoordinator: l.assignedCoordinator || l.coordinator || null,
          requestedDetails: l.requestedDetails || {
            notes: "Initial service request from PA coordinator pipeline.",
            budgetLimit: l.price ? `₹${parseFloat(l.price).toLocaleString()}` : "₹1,500",
            locationPreference: "Ramamurthy Nagar",
            detailsSummary: "Client requested prompt execution. Check contacts checklist."
          }
        }));
        setLeads(parsed);
      } else {
        // Default seed data
        const defaultSeeds: Lead[] = [
          {
            id: "L1",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            leadType: "Service Request",
            seekerName: "Ramesh Sharma",
            seekerPhone: "+91 98871 00293",
            seekerEmail: "ramesh.sharma@gmail.com",
            vendorName: "Grand Royal Palace",
            category: "Marriage Halls",
            action: "Requested rate verification",
            status: "Pending Assignment",
            requestedDetails: {
              eventType: "Marriage Reception",
              guestCount: 650,
              targetDate: "2026-08-15",
              budgetLimit: "₹2,50,000",
              location: "Ramamurthy Nagar",
              specialNotes: "Needs AC and seating valet parking."
            }
          },
          {
            id: "L2",
            timestamp: new Date(Date.now() - 900000).toISOString(),
            leadType: "Provider Verification",
            seekerName: "Apollo Pharmacy RM Nagar",
            seekerPhone: "+91 98450 11283",
            seekerEmail: "onboard@apollopharmacy.in",
            vendorName: "Apollo Pharmacy Store",
            category: "Pharma Provider",
            action: "Provider Onboard Verification",
            status: "Pending Assignment",
            requestedDetails: {
              licenseNo: "DL-39201-B",
              onboardDate: "2026-06-29",
              address: "Main Road, Ramamurthy Nagar, Bangalore",
              catalogsCount: 154,
              verifiedDeliveryChannel: "active"
            }
          },
          {
            id: "L3",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            leadType: "Seeker Verification",
            seekerName: "Amit Hegde",
            seekerPhone: "+91 97728 39201",
            seekerEmail: "amit.hegde@outlook.com",
            vendorName: "Self Seeker",
            category: "Delivery Seeker",
            action: "Seeker Registration Check",
            status: "Pending Assignment",
            requestedDetails: {
              activityArea: "Ramamurthy Nagar & Banaswadi",
              seekerType: "Individual Client",
              registeredService: "Urgent Courier Delivery",
              idProofType: "Aadhaar Card",
              idProofVerified: "Pending audit"
            }
          },
          {
            id: "L4",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            leadType: "Service Request",
            seekerName: "Dr. Shalini",
            seekerPhone: "+91 90028 11920",
            seekerEmail: "shalini.doc@apollo.com",
            vendorName: "Swiggy Delivery",
            category: "Food Delivery",
            action: "Payment checkout complete",
            status: "Verified",
            assignedCoordinator: "Coordinator Rajesh",
            requestedDetails: {
              itemsOrdered: "Masala Dosa x2, Filter Coffee x1",
              deliveryAddress: "Apollo Clinic, RM Nagar",
              paidAmount: "₹245.00",
              paymentMode: "UPI Paid"
            }
          }
        ];
        localStorage.setItem("demandgenius_leads", JSON.stringify(defaultSeeds));
        setLeads(defaultSeeds);
      }
    } catch {}
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const saveLeadsToStorage = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem("demandgenius_leads", JSON.stringify(updatedLeads));
  };

  const handleClaimLead = (leadId: string) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: "Claimed" as any,
          assignedCoordinator: "Superadmin Coordinator"
        };
      }
      return l;
    });
    saveLeadsToStorage(updated);
    showToast("Lead successfully claimed!");
    
    // Update active modal state
    const current = updated.find(x => x.id === leadId);
    if (current) setSelectedLead(current);
  };

  const handleVerifyLead = (leadId: string, approve: boolean) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: (approve ? "Verified" : "Rejected") as any,
          assignedCoordinator: l.assignedCoordinator || "Superadmin Coordinator"
        };
      }
      return l;
    });
    saveLeadsToStorage(updated);
    showToast(approve ? "Entity Verification Approved!" : "Entity Registration Rejected");
    
    const current = updated.find(x => x.id === leadId);
    if (current) setSelectedLead(current);
  };

  const handleAddLog = () => {
    if (!selectedLead || !noteText.trim()) return;
    const updated = leads.map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          action: `${l.action} | Coordinator Note: ${noteText}`
        };
      }
      return l;
    });
    saveLeadsToStorage(updated);
    setNoteText("");
    showToast("Note added successfully!");
    
    const current = updated.find(x => x.id === selectedLead.id);
    if (current) setSelectedLead(current);
  };

  // Filter logic
  const filtered = leads.filter(l => {
    // Tab filters
    if (activeTab === "requests" && l.leadType !== "Service Request") return false;
    if (activeTab === "providers" && l.leadType !== "Provider Verification") return false;
    if (activeTab === "seekers" && l.leadType !== "Seeker Verification") return false;

    // Search filters
    const s = search.toLowerCase();
    return (
      l.seekerName.toLowerCase().includes(s) ||
      l.vendorName.toLowerCase().includes(s) ||
      l.category.toLowerCase().includes(s) ||
      l.status.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 border border-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
          <CheckCircle2 size={13}/>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shrink-0">
          <Shield size={20} className="text-white"/>
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 leading-tight">Coordinator Leads & Verification Hub</h1>
          <p className="text-gray-500 text-xs">Verify local seekers/providers, claim client requests & orchestrate deals</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Active Inquiries</span>
          <span className="text-2xl font-black text-gray-900 block mt-1">{leads.length} Leads</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending Coordinator Assignment</span>
          <span className="text-2xl font-black text-yellow-600 block mt-1">{leads.filter(l => l.status === "Pending Assignment").length} Leads</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Verified Entities</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{leads.filter(l => l.status === "Verified").length} Verified</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Claimed & In-Progress</span>
          <span className="text-2xl font-black text-indigo-600 block mt-1">{leads.filter(l => l.status === "Claimed").length} Assigned</span>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: "all", label: "All Inquiries" },
            { id: "requests", label: "Service Requests" },
            { id: "providers", label: "Provider Verification" },
            { id: "seekers", label: "Seeker Verification" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.id ? "bg-white shadow-sm text-orange-500" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads by seeker, status..."
            className="w-full border border-gray-250 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                <th className="p-3.5">Category Type</th>
                <th className="p-3.5">Seeker/Registered Entity</th>
                <th className="p-3.5">Core Category</th>
                <th className="p-3.5">Activity Log</th>
                <th className="p-3.5">Assigned Coordinator</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filtered.map(lead => {
                let typeBadge = "bg-blue-50 text-blue-700 border-blue-150";
                if (lead.leadType === "Provider Verification") typeBadge = "bg-emerald-50 text-emerald-700 border-emerald-150";
                if (lead.leadType === "Seeker Verification") typeBadge = "bg-purple-50 text-purple-700 border-purple-150";

                let statusBadge = "bg-gray-50 text-gray-500 border-gray-250";
                if (lead.status === "Claimed") statusBadge = "bg-indigo-50 text-indigo-700 border border-indigo-150";
                if (lead.status === "Verified") statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-150";
                if (lead.status === "Rejected") statusBadge = "bg-red-50 text-red-700 border border-red-150";

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/50">
                    <td className="p-3.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeBadge}`}>
                        {lead.leadType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">{lead.seekerName}</td>
                    <td className="p-3.5 text-gray-500">{lead.category}</td>
                    <td className="p-3.5 text-gray-500 max-w-xs truncate">{lead.action}</td>
                    <td className="p-3.5 text-gray-500 italic">{lead.assignedCoordinator || "None"}</td>
                    <td className="p-3.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {lead.status === "Pending Assignment" && (
                        <button
                          onClick={() => handleClaimLead(lead.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                        >
                          Claim Lead
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-gray-200"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 italic">No inquiries found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <span className="text-[9px] bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  {selectedLead.leadType}
                </span>
                <h3 className="font-black text-gray-900 text-sm mt-1">Lead Details: {selectedLead.seekerName}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18}/>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Contact Information */}
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Seeker Contact Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-gray-800">
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} className="text-orange-500 shrink-0"/>
                    <a href={`tel:${selectedLead.seekerPhone}`} className="hover:underline text-orange-600 font-bold">{selectedLead.seekerPhone}</a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={11} className="text-orange-500 shrink-0"/>
                    <a href={`mailto:${selectedLead.seekerEmail}`} className="hover:underline text-orange-600 font-bold">{selectedLead.seekerEmail}</a>
                  </div>
                </div>
              </div>

              {/* Submitted Request Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <FileText size={11}/>
                  <span>Details Submitted / Requested by Guest</span>
                </div>
                <div className="bg-gray-950 text-emerald-400 p-3.5 rounded-xl font-mono text-[10px] leading-relaxed overflow-x-auto max-h-48">
                  <pre>{JSON.stringify(selectedLead.requestedDetails, null, 2)}</pre>
                </div>
              </div>

              {/* Status and Coordinator info */}
              <div className="flex justify-between items-center text-[10px] text-gray-500 py-1.5 border-t border-b border-gray-100">
                <span>Assigned Coordinator: <strong>{selectedLead.assignedCoordinator || "Unassigned"}</strong></span>
                <span>Inquiry Status: <strong>{selectedLead.status}</strong></span>
              </div>

              {/* Coordinator Notes Log */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Inquiry Action Progress Trace</label>
                <div className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-gray-700 italic max-h-24 overflow-y-auto">
                  {selectedLead.action}
                </div>
              </div>

              {/* Add Progress Note form */}
              {selectedLead.status === "Claimed" && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Log Coordinator Action Note</label>
                  <div className="flex gap-2">
                    <input
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Enter dialer logs, rate agreement, or booking status..."
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                    />
                    <button
                      onClick={handleAddLog}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                    >
                      Log Note
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
              {selectedLead.leadType.includes("Verification") && selectedLead.status === "Pending Assignment" && (
                <>
                  <button
                    onClick={() => handleVerifyLead(selectedLead.id, false)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold"
                  >
                    Reject Registration
                  </button>
                  <button
                    onClick={() => handleVerifyLead(selectedLead.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    Approve & Verify Live
                  </button>
                </>
              )}
              {selectedLead.leadType.includes("Verification") && selectedLead.status === "Claimed" && (
                <>
                  <button
                    onClick={() => handleVerifyLead(selectedLead.id, false)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold"
                  >
                    Reject Registration
                  </button>
                  <button
                    onClick={() => handleVerifyLead(selectedLead.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    Verify & Onboard
                  </button>
                </>
              )}
              {selectedLead.status === "Pending Assignment" && (
                <button
                  onClick={() => handleClaimLead(selectedLead.id)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  Claim & Take Lead
                </button>
              )}
              <button
                onClick={() => setSelectedLead(null)}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
