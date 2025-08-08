
'use client';

import type { FC } from 'react';
import React, { memo } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeatingInfo } from '@/app/students/types';


interface SeatProps {
  seatId: string;
  seatingInfo: SeatingInfo | undefined;
  isSelected: boolean;
  onSelect: (seatId: string) => void;
}

const Seat: FC<SeatProps> = memo(({ seatId, seatingInfo, isSelected, onSelect }) => {
  const isOccupied = !!seatingInfo;
  const isMarked = seatingInfo?.isMarked || false;

  const buttonContent = (
    <div className="flex flex-col items-center justify-center h-full w-full p-1">
      {isOccupied ? (
        <>
          <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          <span className="text-xs mt-1 truncate max-w-full">{seatingInfo.studentId}</span>
        </>
      ) : (
        <span className="text-[10px] sm:text-xs md:text-sm">{seatId.split('-')[2]}</span>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isSelected ? 'default' : isOccupied ? 'secondary' : 'outline'}
            className={cn(
              'h-auto aspect-square w-full p-0 transition-all duration-200 transform hover:scale-105',
              isSelected && 'ring-4 ring-accent ring-offset-2',
              isMarked && 'bg-green-500/30 hover:bg-green-500/40 border-green-500',
              isOccupied && !isSelected && !isMarked && 'bg-primary/20 hover:bg-primary/30',
            )}
            onClick={() => onSelect(seatId)}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Seat: {seatId}</p>
          {seatingInfo && <p>Student ID: {seatingInfo.studentId}</p>}
          {isMarked && <p className="text-green-600 font-bold">Marked</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

Seat.displayName = 'Seat';

interface Section {
    id: string;
    rows: number;
    cols: number;
}

interface ClassroomGridProps {
  sections: Section[];
  seatingArrangement: Map<string, SeatingInfo>;
  selectedSeat: string | null;
  onSeatSelect: (seatId: string) => void;
}

export const ClassroomGrid: FC<ClassroomGridProps> = ({ sections, seatingArrangement, selectedSeat, onSeatSelect }) => {
  
  const generateGridForSection = (section: Section) => {
    return Array.from({ length: section.rows }, (_, i) =>
      Array.from({ length: section.cols }, (_, j) => {
        const rowLabel = i + 1;
        const colLabel = j + 1;
        return `${section.id}-${rowLabel}-${colLabel}`;
      })
    );
  };

  return (
    <>
      {sections.map(section => (
        <Card className="shadow-lg" key={section.id}>
            <CardHeader>
                <CardTitle>Section {section.id}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-x-auto">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-muted px-4 py-1 rounded-b-lg text-sm font-medium text-muted-foreground">
                        Front
                    </div>
                  <div 
                    className="grid gap-1 sm:gap-2 p-4 pt-10" 
                    style={{ gridTemplateColumns: `repeat(${section.cols}, minmax(0, 1fr))` }}
                  >
                    {generateGridForSection(section).flat().map(seatId => (
                      <Seat
                        key={seatId}
                        seatId={seatId}
                        seatingInfo={seatingArrangement.get(seatId)}
                        isSelected={selectedSeat === seatId}
                        onSelect={onSeatSelect}
                      />
                    ))}
                  </div>
                </div>
            </CardContent>
        </Card>
      ))}
    </>
  );
};
