import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import logo from '@/assets/logo.png';
import { CertificateRequest } from '@/types/barangay';
import { format } from 'date-fns';
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



  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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
            <Button variant="outline" size="icon" onClick={handleDownloadPDF} title="Download PDF">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="border-2 border-primary/20 rounded-lg bg-card p-8" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src={logo} alt="Barangay Logo" className="w-16 h-16 object-contain" />
            </div>
            <div className="text-center flex-1 px-4">
              <p className="text-[10px] text-muted-foreground italic">Republic of the Philippines</p>
              <p className="text-[10px] text-muted-foreground italic">Cordillera Administrative Region</p>
              <p className="text-[10px] text-muted-foreground italic">City of Baguio</p>
              <p className="text-sm font-bold tracking-wide">PALMA-URBANO BARANGAY</p>
              <p className="text-[10px] text-muted-foreground italic">Sofia V. Reyes Alley, Yandoc St.</p>
              <p className="text-[10px] text-muted-foreground italic">Tel. No. 424-4085</p>
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
              <img src={logo} alt="Barangay Seal" className="w-16 h-16 object-contain" />
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
