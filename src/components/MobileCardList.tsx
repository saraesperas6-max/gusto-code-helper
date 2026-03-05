import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

export interface CardField {
  label: string;
  value: React.ReactNode;
  hidden?: boolean;
}

interface MobileCardListProps {
  items: {
    key: string;
    fields: CardField[];
    actions?: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }[];
  emptyMessage?: string;
}

const MobileCardList: React.FC<MobileCardListProps> = ({ items, emptyMessage = 'No items found.' }) => {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-xs sm:text-sm">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.key}
          className={`rounded-lg border bg-card p-3 space-y-2 ${item.className || ''}`}
          onClick={item.onClick}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {item.fields
              .filter((f) => !f.hidden)
              .map((field, i) => (
                <div key={i} className={i === 0 ? 'col-span-2' : ''}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{field.label}</p>
                  <div className="text-xs font-medium text-foreground mt-0.5 truncate">{field.value}</div>
                </div>
              ))}
          </div>
          {item.actions && (
            <div className="flex items-center gap-1 pt-1 border-t border-border/50">
              {item.actions}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(MobileCardList);
