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

const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ request, open, onOpenChange, residentAddress }) => {
  const cert = getCertificateBody(request, residentAddress || '');
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (!open) return;
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        const s = Math.min(1, availableWidth / A4_WIDTH_PX);
        setScale(s);
      }
    };
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => { clearTimeout(timer); window.removeEventListener('resize', updateScale); };
  }, [open]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    // Temporarily reset scale to render at full A4 size for consistent PDF output
    const wrapper = printRef.current.parentElement;
    const prevTransform = wrapper?.style.transform;
    const prevHeight = wrapper?.style.height;
    const prevMaxWidth = wrapper?.style.maxWidth;
    if (wrapper) {
      wrapper.style.transform = 'none';
      wrapper.style.height = 'auto';
      wrapper.style.maxWidth = 'none';
    }
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: A4_WIDTH_PX, height: A4_HEIGHT_PX });
    // Restore scale
    if (wrapper) {
      wrapper.style.transform = prevTransform || '';
      wrapper.style.height = prevHeight || '';
      wrapper.style.maxWidth = prevMaxWidth || '';
    }
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${cert.title} - ${request.residentName}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] w-[96vw] max-h-[95dvh] overflow-hidden p-2 sm:p-6 [&>button]:top-2 [&>button]:right-2 [&>button]:h-7 [&>button]:w-7 sm:[&>button]:top-4 sm:[&>button]:right-4 sm:[&>button]:h-8 sm:[&>button]:w-8">
        <DialogHeader className="pb-1 sm:pb-2 pr-10">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xs sm:text-lg truncate">{cert.title} Preview</DialogTitle>
            <Button variant="outline" size="icon" onClick={handleDownloadPDF} title="Download PDF" className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 mr-1">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div ref={containerRef} className="flex justify-center overflow-hidden w-full">
          <div
            style={{
              width: A4_WIDTH_PX,
              minHeight: A4_HEIGHT_PX,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              height: A4_HEIGHT_PX * scale,
              maxWidth: A4_WIDTH_PX * scale,
            }}
          >
            <div
              ref={printRef}
              className="bg-white border border-border/40 shadow-sm"
              style={{
                width: A4_WIDTH_PX,
                minHeight: A4_HEIGHT_PX,
                padding: '48px 40px',
                fontFamily: "'Times New Roman', Times, serif",
                color: '#1a1a1a',
                boxSizing: 'border-box',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={logo} alt="Barangay Logo" className="w-16 h-16 object-contain" />
                </div>
                <div className="text-center flex-1 px-4">
                  <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>Republic of the Philippines</p>
                  <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>Cordillera Administrative Region</p>
                  <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>City of Baguio</p>
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>PALMA-URBANO BARANGAY</p>
                  <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>Sofia V. Reyes Alley, Yandoc St.</p>
                  <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>Tel. No. 424-4085</p>
                </div>
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={logo} alt="Barangay Seal" className="w-16 h-16 object-contain" />
                </div>
              </div>

              {/* Banner */}
              <div style={{ background: 'hsl(220 70% 50% / 0.1)', textAlign: 'center', padding: '4px 0', borderRadius: 4, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontStyle: 'italic', fontWeight: 600, color: 'hsl(220 70% 50%)' }}>Office of the Punong Barangay</p>
              </div>

              <hr style={{ borderColor: 'hsl(220 70% 50% / 0.3)', marginBottom: 24 }} />

              {/* Certificate Title */}
              <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', fontStyle: 'italic', marginBottom: 24 }}>{cert.title}</h2>

              {/* Certificate Body */}
              <div className="space-y-4" style={{ fontSize: 13, lineHeight: 1.7, padding: '0 8px' }}>
                {cert.body}
              </div>

              {/* Signature Area */}
              <div style={{ marginTop: 40 }} className="space-y-8">
                <div>
                  <p style={{ fontSize: 13 }}>Requested by:</p>
                  <div style={{ marginTop: 24, width: 192 }}>
                    <div style={{ borderTop: '1px solid #666' }} />
                    <p style={{ fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginTop: 4 }}>Signature of Applicant</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-center">
                    <p style={{ fontSize: 13 }}>Attested by:</p>
                    <div style={{ marginTop: 24, width: 192 }}>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>HON. FLORIDA T. GACAYAN</p>
                      <p style={{ fontSize: 11, fontStyle: 'italic' }}>Punong Barangay</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground italic text-center">This is a digital preview. The official printed certificate may differ in format.</p>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(CertificatePreview);
