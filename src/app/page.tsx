
'use client';

import type { FC } from 'react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { University, User, Trash2, PlusCircle, XCircle, Archive, ArchiveRestore, CheckCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClassroomGrid } from '@/components/ClassroomGrid';
import { ScannerDialog } from '@/components/ScannerDialog';
import { checkStudentSeating } from './actions';
import { Navbar } from '@/components/Navbar';
import type { Student, SeatingInfo } from './students/types';
import { getStudentByQrId, addStudent } from './students/actions';
import { getSeatingArrangement, updateSeatingArrangement } from './seating/actions';
import { getSections, updateSections } from './sections/actions';
import type { Section } from './sections/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StudentInfoDialog } from '@/components/StudentInfoDialog';
import { AddStudentDialog } from '@/components/AddStudentDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Combobox } from '@/components/ui/combobox';
import { useAuth } from '@/context/AuthContext';


const Header: FC = () => (
  <header className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-3 self-start">
      <div className="bg-primary p-2 rounded-lg">
        <University className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">ClassMapper</h1>
    </div>
    <Navbar />
  </header>
);

interface RemovalCandidate {
    seatId: string;
    studentId: string;
}

interface NewStudentInfo {
    qrId: string;
    seatId: string;
}

export default function Home() {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [seatingArrangement, setSeatingArrangement] = useState<Map<string, SeatingInfo>>(new Map());
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [isStudentInfoOpen, setStudentInfoOpen] = useState(false);
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudentInfo, setNewStudentInfo] = useState<NewStudentInfo | null>(null);
  const [removalCandidate, setRemovalCandidate] = useState<RemovalCandidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultSeat, setSearchResultSeat] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [loadedSections, loadedArrangement] = await Promise.all([
          getSections(),
          getSeatingArrangement(),
        ]);
        setSections(loadedSections.length > 0 ? loadedSections : [{ id: 'A', rows: 5, cols: 8, isArchived: false }]);
        setSeatingArrangement(loadedArrangement);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error loading classroom data',
          description: 'Could not load classroom data. Please try again later.',
        });
      }
    };
    loadData();
  }, [toast, user]);
  
  useEffect(() => {
    if (!searchQuery) {
      setSearchResultSeat(null);
      return;
    }
    
    const foundEntry = Array.from(seatingArrangement.entries()).find(
      ([, info]) => info.studentId.toLowerCase() === searchQuery.toLowerCase()
    );

    if (foundEntry) {
      setSearchResultSeat(foundEntry[0]);
    } else {
      setSearchResultSeat(null);
    }
  }, [searchQuery, seatingArrangement]);


  const handleSeatSelect = useCallback((seatId: string) => {
    if (seatingArrangement.has(seatId)) {
        setSelectedSeat(seatId);
        setStudentInfoOpen(true);
    } else {
        setSelectedSeat(seatId);
        setScannerOpen(true);
    }
  }, [seatingArrangement]);

  const initiateRemoveStudent = (seatId: string) => {
    const studentInfo = seatingArrangement.get(seatId);
    if (studentInfo) {
      setStudentInfoOpen(false);
      setRemovalCandidate({ seatId, studentId: studentInfo.studentId });
    }
  };

  const handleRemoveStudentFromSeat = async () => {
    if (!removalCandidate) return;

    const studentId = removalCandidate.studentId;
    const seatId = removalCandidate.seatId;
    
    const newArrangement = new Map(seatingArrangement);
    newArrangement.delete(seatId);

    try {
        await updateSeatingArrangement(newArrangement);
        setSeatingArrangement(newArrangement);
        if (searchResultSeat === seatId) {
            setSearchResultSeat(null);
            setSearchQuery('');
        }
        toast({
            title: 'Student Un-assigned',
            description: `Student ${studentId} has been removed from seat ${seatId}.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error updating seating',
            description: 'Could not save changes. Please try again.',
        });
    } finally {
        setRemovalCandidate(null);
    }
  }
  
  const assignStudentToSeat = async (student: Student, seatId: string) => {
    const newSeatingInfo: SeatingInfo = {
        ...student,
        seatId: seatId,
        isMarked: false,
    };
    
    const newArrangement = new Map(seatingArrangement).set(seatId, newSeatingInfo);

    try {
        await updateSeatingArrangement(newArrangement);
        setSeatingArrangement(newArrangement);
        toast({
            title: 'Success!',
            description: `Student ${student.studentId} has been assigned to seat ${seatId}.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error updating seating',
            description: 'Could not save changes. Please try again.',
        });
    } finally {
        setSelectedSeat(null);
    }
  }

  const handleAssignStudent = async (qrId: string) => {
    if (!selectedSeat) return;
    setScannerOpen(false);

    const currentSeatingObject = Array.from(seatingArrangement.values()).reduce((acc, info) => {
        acc[info.seatId] = info.qrId;
        return acc;
    }, {} as Record<string, string>);
  
    try {
      const seatingCheck = await checkStudentSeating(qrId, selectedSeat, currentSeatingObject);

      if (seatingCheck.isSeated) {
        toast({
          variant: 'destructive',
          title: 'Error Assigning Seat',
          description: seatingCheck.message,
        });
        return;
      }
      
      const student = await getStudentByQrId(qrId);

      if (!student) {
        setNewStudentInfo({ qrId, seatId: selectedSeat });
        setAddStudentOpen(true);
        return;
      }

      await assignStudentToSeat(student, selectedSeat);
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Unexpected Error Occurred',
        description: 'Failed to assign student. Please try again later.',
      });
    }
  };
  
  const handleAddNewStudent = async (studentData: Pick<Student, 'studentId'>) => {
    if (!newStudentInfo) return;
    
    const newStudent: Student = {
        ...studentData,
        qrId: newStudentInfo.qrId,
    };

    try {
        await addStudent(newStudent);
        toast({
            title: 'Student Added',
            description: `Student ${newStudent.studentId} has been added to the database.`,
        });
        setAddStudentOpen(false);
        await assignStudentToSeat(newStudent, newStudentInfo.seatId);
        setNewStudentInfo(null);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Adding Student',
            description: 'Failed to save student to the database.',
        });
    }
  };


  const handleReset = async () => {
    try {
      await updateSeatingArrangement(new Map());
      setSeatingArrangement(new Map());
      setSelectedSeat(null);
      setSearchResultSeat(null);
      setSearchQuery('');
      toast({
          title: 'Seating Cleared',
          description: 'All student assignments have been removed.',
      });
    } catch(error) {
       toast({
            variant: 'destructive',
            title: 'Error Clearing Seating',
            description: 'Could not clear seating. Please try again.',
        });
    }
  }

  const toggleMarkedSeat = async (seatId: string) => {
    const studentInfo = seatingArrangement.get(seatId);
    if (!studentInfo) return;

    const newArrangement = new Map(seatingArrangement);
    newArrangement.set(seatId, { ...studentInfo, isMarked: !studentInfo.isMarked });

    setSeatingArrangement(newArrangement);

    try {
      await updateSeatingArrangement(newArrangement);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error updating mark',
            description: 'Could not save mark status. Please try again.',
        });
        // Revert UI change on error
        const revertedArrangement = new Map(seatingArrangement);
        revertedArrangement.set(seatId, studentInfo);
        setSeatingArrangement(revertedArrangement);
    }
  };


  const { activeSections, archivedSections, totalSeats } = useMemo(() => {
    const active: Section[] = [];
    const archived: Section[] = [];
    let totalSeats = 0;
    
    sections.forEach(section => {
      if (section.isArchived) {
        archived.push(section);
      } else {
        active.push(section);
        totalSeats += section.rows * section.cols;
      }
    });

    return { activeSections: active, archivedSections: archived, totalSeats };
  }, [sections]);

  const seatingStats = useMemo(() => {
    const occupiedSeats = seatingArrangement.size;
    const availableSeats = totalSeats - occupiedSeats;
    return { totalSeats, occupiedSeats, availableSeats };
  }, [totalSeats, seatingArrangement]);

  const studentOptions = useMemo(() => {
      return Array.from(seatingArrangement.values()).map(info => ({
          value: info.studentId.toLowerCase(),
          label: info.studentId,
      }));
  }, [seatingArrangement]);
  
  const saveSections = async (updatedSections: Section[]) => {
    setSections(updatedSections);
    try {
      await updateSections(updatedSections);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving sections',
        description: 'Could not save section layout changes.',
      });
    }
  };

  const addSection = () => {
    const newSections = [
      ...sections,
      { id: String.fromCharCode(65 + sections.length), rows: 5, cols: 8, isArchived: false },
    ];
    saveSections(newSections);
  };

  const removeSection = (id: string) => {
    const newSeating = new Map(seatingArrangement);
    let wasChanged = false;
    for (const seatId of newSeating.keys()) {
        if(seatId.startsWith(`${id}-`)) {
            newSeating.delete(seatId);
            wasChanged = true;
        }
    }
    
    if(selectedSeat?.startsWith(`${id}-`)) {
        setSelectedSeat(null);
    }
    if (searchResultSeat?.startsWith(`${id}-`)) {
        setSearchResultSeat(null);
        setSearchQuery('');
    }

    const updateAfterRemoval = async () => {
      try {
        if (wasChanged) {
          await updateSeatingArrangement(newSeating);
        }
        setSeatingArrangement(newSeating);
        
        const newSections = sections.filter(s => s.id !== id)
          .map((s, i) => ({ ...s, id: String.fromCharCode(65 + i) }));

        saveSections(newSections);

      } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Error updating classroom',
            description: 'Could not save changes after removing section.',
        });
      }
    }
    updateAfterRemoval();
  };

  const updateSection = (id: string, key: 'rows' | 'cols', value: number) => {
    const newSections = sections.map(s => (s.id === id ? { ...s, [key]: Math.max(1, value || 1) } : s))
    saveSections(newSections);
  };

  const toggleSectionArchive = (id: string) => {
    const newSections = sections.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s);
    saveSections(newSections);
  }

  const isMarked = searchResultSeat ? seatingArrangement.get(searchResultSeat)?.isMarked : false;


  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ClassroomGrid
              sections={activeSections}
              seatingArrangement={seatingArrangement}
              selectedSeat={searchResultSeat} 
              onSeatSelect={handleSeatSelect}
            />
          </div>
          <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Student Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <Combobox
                        options={studentOptions}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search for a student..."
                    />
                     <div className="mt-4 text-center text-sm min-h-[40px] flex items-center justify-center">
                        {searchQuery && searchResultSeat && (
                          <div className='flex items-center gap-4'>
                            <p>Seat: <span className="font-bold text-accent">{searchResultSeat}</span></p>
                             <Button
                                variant={isMarked ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleMarkedSeat(searchResultSeat)}
                                className={isMarked ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {isMarked ? 'Marked' : 'Mark'}
                            </Button>
                          </div>
                        )}
                        {searchQuery && !searchResultSeat && (
                            <p className="text-muted-foreground">Student not found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {activeSections.map((section) => (
                    <div key={section.id} className="p-3 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-foreground">Section {section.id}</p>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-accent/10 hover:text-accent" onClick={() => toggleSectionArchive(section.id)}>
                             <Archive className="h-5 w-5" />
                           </Button>
                          {sections.length > 1 && (
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removeSection(section.id)}>
                               <XCircle className="h-5 w-5" />
                             </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`rows-${section.id}`}>Rows</Label>
                          <Input
                            id={`rows-${section.id}`}
                            type="number"
                            value={section.rows}
                            onChange={e => updateSection(section.id, 'rows', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`cols-${section.id}`}>Columns</Label>
                          <Input
                            id={`cols-${section.id}`}
                            type="number"
                            value={section.cols}
                            onChange={e => updateSection(section.id, 'cols', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {archivedSections.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/30 rounded-md text-sm font-medium">
                        Archived Sections ({archivedSections.length})
                        <ArchiveRestore className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {archivedSections.map((section) => (
                           <div key={section.id} className="flex items-center justify-between p-2 pl-4 bg-muted/50 rounded-lg">
                              <p className="font-medium text-foreground">Section {section.id}</p>
                              <Button variant="ghost" size="sm" onClick={() => toggleSectionArchive(section.id)}>
                                <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                              </Button>
                           </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>

                <Button onClick={addSection} variant="outline" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                </Button>

                 <Button onClick={handleReset} variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" /> Reset All Seating
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around text-center">
                    <div>
                        <p className="text-2xl font-bold">{seatingStats.occupiedSeats}</p>
                        <p className="text-sm text-muted-foreground">Occupied</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{seatingStats.availableSeats}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{seatingStats.totalSeats}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <ScannerDialog
        isOpen={isScannerOpen}
        onOpenChange={(isOpen) => {
            setScannerOpen(isOpen);
            if (!isOpen) {
                setSelectedSeat(null); 
            }
        }}
        onAssign={handleAssignStudent}
        seatId={selectedSeat}
      />
      {selectedSeat && seatingArrangement.has(selectedSeat) && (
        <StudentInfoDialog
            isOpen={isStudentInfoOpen}
            onOpenChange={(isOpen) => {
                setStudentInfoOpen(isOpen);
                if (!isOpen) {
                    setSelectedSeat(null);
                }
            }}
            student={seatingArrangement.get(selectedSeat)!}
            onRemove={initiateRemoveStudent}
        />
      )}
      {newStudentInfo && (
        <AddStudentDialog
            isOpen={isAddStudentOpen}
            onOpenChange={(isOpen) => {
                setAddStudentOpen(isOpen);
                if (!isOpen) {
                    setNewStudentInfo(null);
                }
            }}
            qrId={newStudentInfo.qrId}
            onSubmit={handleAddNewStudent}
        />
      )}
      <AlertDialog
        open={!!removalCandidate}
        onOpenChange={() => setRemovalCandidate(null)}
      >
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to remove student {removalCandidate?.studentId} from seat {removalCandidate?.seatId}?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveStudentFromSeat} className="bg-destructive hover:bg-destructive/90">
                    Remove
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
