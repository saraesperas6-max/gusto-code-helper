import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import logo from '@/assets/logo.png';
import { CertificateRequest } from '@/types/barangay';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificatePreviewProps {
  request: CertificateRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentAddress?: string;
}

const getCertificateBody = (request: CertificateRequest, address: string) => {
  const name = request.residentName;
  const dateIssued = request.dateProcessed ? format(new Date(request.dateProcessed), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy');

  switch (request.certificateType) {
    case 'Barangay Clearance':
      return {
        title: 'Barangay Clearance',
        body: (
          <>
            <p className="font-semibold italic">TO WHOM IT MAY CONCERN:</p>
            <p className="leading-relaxed">
              This is to certify that <span className="font-bold underline">{name}</span>, of legal age, Filipino, is a bonafide resident of{' '}
              <span className="font-semibold">{address || 'Palma-Urbano Barangay, Baguio City'}</span> up to present.
            </p>
            <p className="leading-relaxed">
              <span className="font-semibold italic">FURTHER</span>, this is to <span className="font-semibold">CERTIFY</span> that he/she has NO derogatory NOR pending criminal/civil/administrative charges filed in this barangay.
            </p>
            <p className="leading-relaxed">
              ISSUED this <span className="font-semibold">{dateIssued}</span> here at the Office of Palma-Urbano Barangay Hall, Baguio City, Philippines upon the request of the aforesaid resident for{' '}
              <span className="font-semibold underline">{request.purpose}</span>.
            </p>
          </>
        ),
      };
    case 'Certificate of Residency':
      return {
        title: 'Certificate of Residency',
        body: (
          <>
            <p className="font-semibold italic">TO WHOM IT MAY CONCERN:</p>
            <p className="leading-relaxed">
              This is to <span className="font-semibold">CERTIFY</span> that according to the records of this office, <span className="font-bold underline">{name}</span>, of legal age, Filipino, is a bonafide resident of{' '}
              <span className="font-semibold">{address || 'Palma-Urbano Barangay, Baguio City'}</span>.
            </p>
            <p className="leading-relaxed">
              This is to certify further that <span className="font-bold">{name}</span> has been in the above address up to present.
            </p>
            <p className="leading-relaxed">
              ISSUED this <span className="font-semibold">{dateIssued}</span> at Palma-Urbano Barangay Hall, Baguio City, Philippines upon request of the aforesaid resident for{' '}
              <span className="font-semibold underline">{request.purpose}</span>.
            </p>
          </>
        ),
      };
    case 'Certificate of Indigency':
      return {
        title: 'Certificate of Indigency',
        body: (
          <>
            <p className="font-semibold italic">TO WHOM IT MAY CONCERN:</p>
            <p className="leading-relaxed">
              This is to certify that <span className="font-bold underline">{name}</span>, is a bonafide resident of{' '}
              <span className="font-semibold">{address || 'Palma-Urbano Barangay, Baguio City'}</span> and belongs to the indigent sector of the community.
            </p>
            <p className="leading-relaxed">
              ISSUED this <span className="font-semibold">{dateIssued}</span> at Palma-Urbano Barangay Hall, Baguio City, Philippines upon request of the aforesaid resident for{' '}
              <span className="font-semibold underline">{request.purpose}</span>.
            </p>
          </>
        ),
      };
    case 'Certificate of Low Income':
      return {
        title: 'Certificate of Low Income',
        body: (
          <>
            <p className="font-semibold italic">TO WHOM IT MAY CONCERN:</p>
            <p className="leading-relaxed">
              This is to certify that, according to the records of this office, <span className="font-bold underline">{name}</span>, is a bonafide resident of{' '}
              <span className="font-semibold">{address || 'Palma-Urbano Barangay, Baguio City'}</span>.
            </p>
            <p className="leading-relaxed">
              It is further certified that <span className="font-bold">{name}</span> belongs to a low-income family.
            </p>
            <p className="leading-relaxed">
              ISSUED this <span className="font-semibold">{dateIssued}</span> at Palma-Urbano Barangay Hall, Baguio City, Philippines upon request of the aforesaid resident for{' '}
              <span className="font-semibold underline">{request.purpose}</span>.
            </p>
          </>
        ),
      };
    case 'Oath of Undertaking':
      return {
        title: 'Oath of Undertaking',
        body: (
          <>
            <p className="font-semibold text-center">Republic Act 11261 — First Time Jobseekers Assistance Act</p>
            <p className="leading-relaxed">
              I, <span className="font-bold underline">{name}</span>, of legal age, resident of{' '}
              <span className="font-semibold">{address || 'Palma-Urbano Barangay, Baguio City'}</span>, availing the benefits of <span className="font-semibold">Republic Act 11261</span>, otherwise known as the First Time Jobseekers Act of 2019, do hereby declare, agree and undertake to abide and be bound by the provisions thereof.
            </p>
            <p className="leading-relaxed">
              Signed this <span className="font-semibold">{dateIssued}</span>.
            </p>
          </>
        ),
      };
    case 'Business Permit':
      return {
        title: 'Business Permit',
        body: (
          <>
            <p className="font-semibold italic">TO WHOM IT MAY CONCERN:</p>
            <p className="leading-relaxed">
              This is to certify that <span className="font-bold underline">{name}</span>, of legal age, Filipino, residing at{' '}
              <span className="font-semibold">{address || 'Palma-Urbano Barangay, Baguio City'}</span>, is hereby granted a Barangay Business Permit to operate a business within the jurisdiction of this barangay.
            </p>
            <p className="leading-relaxed">
              ISSUED this <span className="font-semibold">{dateIssued}</span> at Palma-Urbano Barangay Hall, Baguio City, Philippines for{' '}
              <span className="font-semibold underline">{request.purpose}</span>.
            </p>
          </>
        ),
      };
    default:
      return {
        title: request.certificateType,
        body: (
          <>
            <p className="font-semibold italic">TO WHOM IT MAY CONCERN:</p>
            <p className="leading-relaxed">
              This document is issued to <span className="font-bold underline">{name}</span> for{' '}
              <span className="font-semibold underline">{request.purpose}</span>.
            </p>
            <p className="leading-relaxed">
              ISSUED this <span className="font-semibold">{dateIssued}</span> at Palma-Urbano Barangay Hall, Baguio City, Philippines.
            </p>
          </>
        ),
      };
  }
};

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ request, open, onOpenChange, residentAddress }) => {
  const cert = getCertificateBody(request, residentAddress || '');
  const printRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  const getComputedStyles = () => {
    const root = document.documentElement;
    const getVar = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
    return {
      primary: getVar('--primary'),
      foreground: getVar('--foreground'),
      mutedForeground: getVar('--muted-foreground'),
      cardBg: getVar('--card'),
    };
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const vars = getComputedStyles();
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${cert.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: hsl(${vars.foreground}); background: white; }
        .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; }
        .italic { font-style: italic; } .underline { text-decoration: underline; }
        .text-center { text-align: center; }
        .leading-relaxed { line-height: 1.625; }
        .flex { display: flex; } .flex-1 { flex: 1; }
        .items-center { align-items: center; } .justify-between { justify-content: space-between; } .justify-end { justify-content: flex-end; }
        .mb-2 { margin-bottom: 0.5rem; } .mb-4 { margin-bottom: 1rem; } .mb-6 { margin-bottom: 1.5rem; }
        .mt-1 { margin-top: 0.25rem; } .mt-6 { margin-top: 1.5rem; } .mt-10 { margin-top: 2.5rem; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; } .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .p-8 { padding: 2rem; }
        .space-y-4 > * + * { margin-top: 1rem; } .space-y-8 > * + * { margin-top: 2rem; }
        .text-xs { font-size: 0.75rem; } .text-sm { font-size: 0.875rem; } .text-xl { font-size: 1.25rem; }
        .text-\\[10px\\] { font-size: 10px; }
        .tracking-wide { letter-spacing: 0.025em; }
        .rounded { border-radius: 0.25rem; } .rounded-full { border-radius: 9999px; } .rounded-lg { border-radius: 0.5rem; }
        .overflow-hidden { overflow: hidden; }
        .w-16 { width: 4rem; } .h-16 { height: 4rem; } .w-48 { width: 12rem; }
        .w-full { width: 100%; } .h-full { height: 100%; }
        .object-cover { object-fit: cover; }
        .border-2 { border: 2px solid hsla(${vars.primary}, 0.2); }
        .border-t { border-top: 1px solid hsla(${vars.foreground}, 0.5); }
        hr { border: none; border-top: 1px solid hsla(${vars.primary}, 0.3); }
        .text-muted-foreground { color: hsl(${vars.mutedForeground}); }
        .text-primary { color: hsl(${vars.primary}); }
        .bg-primary\\/10, .bg-primary-10 { background-color: hsla(${vars.primary}, 0.1); }
        .border-primary\\/30 { border-color: hsla(${vars.primary}, 0.3); }
        img { width: 100%; height: 100%; object-fit: cover; }
        @media print { body { padding: 20px; } @page { margin: 1cm; } }
      </style>
      </head><body>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${cert.title} - ${request.residentName}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{cert.title} Preview</DialogTitle>
            {isAdmin ? (
              <Button variant="outline" size="sm" onClick={handlePrint} title="Print Certificate" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} title="Download as PDF" className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        <div ref={printRef} className="border-2 border-primary/20 rounded-lg bg-card p-8" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center">
              <img src={logo} alt="Barangay Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center flex-1 px-4">
              <p className="text-[10px] text-muted-foreground italic">Republic of the Philippines</p>
              <p className="text-[10px] text-muted-foreground italic">Cordillera Administrative Region</p>
              <p className="text-[10px] text-muted-foreground italic">City of Baguio</p>
              <p className="text-sm font-bold tracking-wide">PALMA-URBANO BARANGAY</p>
              <p className="text-[10px] text-muted-foreground italic">Sofia V. Reyes Alley, Yandoc St.</p>
              <p className="text-[10px] text-muted-foreground italic">Tel. No. 424-4085</p>
            </div>
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center">
              <img src={logo} alt="Barangay Seal" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Banner */}
          <div className="bg-primary/10 text-center py-1 rounded mb-4">
            <p className="text-sm italic font-semibold text-primary">Office of the Punong Barangay</p>
          </div>

          <hr className="border-primary/30 mb-6" />

          {/* Certificate Title */}
          <h2 className="text-xl font-bold text-center italic mb-6">{cert.title}</h2>

          {/* Certificate Body */}
          <div className="space-y-4 text-sm leading-relaxed px-2">
            {cert.body}
          </div>

          {/* Signature Area */}
          <div className="mt-10 space-y-8">
            <div>
              <p className="text-sm">Requested by:</p>
              <div className="mt-6 w-48">
                <div className="border-t border-foreground/50" />
                <p className="text-xs text-center italic mt-1">Signature of Applicant</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="text-center">
                <p className="text-sm">Attested by:</p>
                <div className="mt-6 w-48">
                  <p className="font-bold text-sm">HON. FLORIDA T. GACAYAN</p>
                  <p className="text-xs italic">Punong Barangay</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic text-center">This is a digital preview. The official printed certificate may differ in format.</p>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatePreview;
