import React, { useState, useEffect } from 'react';
import { DukanInvoice, SavedProject } from '../types';
import { hustleRepository } from '../data/hustleRepository';
import { PrintableInvoiceModal } from './PrintableInvoiceModal';
import { triggerWhatsAppShare } from '@/domain/whatsapp';
import { formatInvoiceWhatsAppMessage } from '../services/hustleEngine';
import {
  Printer,
  Share2,
  Trash2,
  Search,
  FolderOpen
} from 'lucide-react';

interface SavedProjectsViewProps {
  language: 'hi' | 'en';
}

export const SavedProjectsView: React.FC<SavedProjectsViewProps> = ({ language }) => {
  const [invoices, setInvoices] = useState<DukanInvoice[]>([]);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'ai_projects'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Modal
  const [selectedInvoice, setSelectedInvoice] = useState<DukanInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [invs, projs] = await Promise.all([
        hustleRepository.listInvoices(),
        hustleRepository.listProjects(),
      ]);
      setInvoices(invs);
      setProjects(projs);
    } catch (err) {
      console.warn('Failed to load saved projects', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteInvoice = async (id: string) => {
    if (confirm(language === 'hi' ? 'क्या आप इस बिल को हटाना चाहते हैं?' : 'Delete this invoice?')) {
      await hustleRepository.deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleToggleInvoiceStatus = async (invoice: DukanInvoice) => {
    const nextStatus = invoice.status === 'paid' ? 'pending' : 'paid';
    await hustleRepository.updateInvoiceStatus(invoice.id, nextStatus);
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoice.id ? { ...i, status: nextStatus } : i))
    );
  };

  const handleDeleteProject = async (id: string) => {
    await hustleRepository.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(searchQuery));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && inv.status === 'paid') ||
      (statusFilter === 'pending' && inv.status !== 'paid');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-amber-400 text-slate-950">
            <FolderOpen className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {language === 'hi' ? 'सहेजे गए बिल व प्रोजेक्ट्स (Saved History)' : 'Saved Invoices & Projects'}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {language === 'hi'
                ? 'दुकान के पुराने बिल देखें, री-प्रिंट करें, WhatsApp भेजें व खाता ट्रैक करें'
                : 'Browse past store invoices, reprint receipts, and view saved drafts'}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'invoices'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧾 दुकान बिल ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('ai_projects')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'ai_projects'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✨ AI ड्राफ्ट्स ({projects.length})
          </button>
        </div>
      </div>

      {/* Invoices List Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="बिल संख्या, ग्राहक का नाम या फोन नंबर से खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-indigo-600"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                  statusFilter === 'all' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600'
                }`}
              >
                सभी
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                  statusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                चुका दिया (Paid)
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600'
                }`}
              >
                उधार / बाकी (Udhaar)
              </button>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-500 text-xs font-bold">
              कोई बिल नहीं मिला। Invoice Studio में जाकर नया बिल बनाएं!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 bg-white border border-slate-200 hover:border-slate-400 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          #{inv.invoiceNumber}
                        </span>
                        <button
                          onClick={() => handleToggleInvoiceStatus(inv)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          }`}
                        >
                          {inv.status === 'paid' ? '✓ PAID' : '⏳ UDHAAR'}
                        </button>
                      </div>

                      <h4 className="text-base font-black text-slate-950 mt-2">
                        {inv.customerName}
                      </h4>
                      {inv.customerPhone && (
                        <p className="text-xs text-slate-500 font-bold">{inv.customerPhone}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        दिनांक: {inv.issueDate} • {inv.items.length} सामान
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-indigo-950 block">
                        ₹{inv.totalAmount.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {inv.paymentMode}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsModalOpen(true);
                        }}
                        className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>बिल देखें</span>
                      </button>

                      <button
                        onClick={() => {
                          const text = formatInvoiceWhatsAppMessage(inv);
                          triggerWhatsAppShare(text, inv.customerPhone);
                        }}
                        className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteInvoice(inv.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Projects Tab */}
      {activeTab === 'ai_projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-500 text-xs font-bold">
              कोई सहेजा गया AI ड्राफ्ट नहीं मिला।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
                      {proj.toolType}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-sm font-black text-slate-950">{proj.title}</h4>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto text-xs font-mono text-slate-700 whitespace-pre-line">
                    {proj.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PrintableInvoiceModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        language={language}
      />
    </div>
  );
};
