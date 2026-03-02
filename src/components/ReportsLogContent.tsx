import React from 'react';
import MobileCardList from '@/components/MobileCardList';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/use-pagination';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { CertificateRequest } from '@/types/barangay';

interface Props {
  requests: CertificateRequest[];
  searchQuery: string;
}

const ReportsLogContent: React.FC<Props> = ({ requests, searchQuery }) => {
  const { paginatedItems, currentPage, totalPages, goToPage, startIndex, endIndex, totalItems } = usePagination(requests);

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="sm:hidden">
        <MobileCardList
          emptyMessage={searchQuery ? 'No matching certificates found.' : 'No certificates issued yet.'}
          items={paginatedItems.map((request) => ({
            key: request.id,
            fields: [
              { label: 'Resident', value: request.residentName },
              { label: 'Date Issued', value: request.dateProcessed ? format(new Date(request.dateProcessed), 'MMM dd, yyyy') : format(new Date(request.dateRequested), 'MMM dd, yyyy') },
              { label: 'Type', value: request.certificateType },
              { label: 'Purpose', value: request.purpose },
            ],
          }))}
        />
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-auto scrollbar-hide">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs px-4">DATE ISSUED</TableHead>
              <TableHead className="text-xs px-4">TYPE</TableHead>
              <TableHead className="text-xs px-4">RESIDENT</TableHead>
              <TableHead className="text-xs px-4">PURPOSE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="text-sm px-4 py-4">
                  {request.dateProcessed
                    ? format(new Date(request.dateProcessed), 'MMM dd, yyyy')
                    : format(new Date(request.dateRequested), 'MMM dd, yyyy')
                  }
                </TableCell>
                <TableCell className="text-sm px-4 py-4">{request.certificateType}</TableCell>
                <TableCell className="text-sm px-4 py-4">{request.residentName}</TableCell>
                <TableCell className="text-sm px-4 py-4">{request.purpose}</TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                  {searchQuery ? 'No matching certificates found.' : 'No certificates issued yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
      />
    </>
  );
};

export default ReportsLogContent;
