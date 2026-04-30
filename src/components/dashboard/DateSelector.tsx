import React from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { es } from 'date-fns/locale';

interface DateSelectorProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
    const handlePrev = () => onDateChange(subDays(selectedDate, 1));
    const handleNext = () => onDateChange(addDays(selectedDate, 1));
    const handleToday = () => onDateChange(new Date());

    const isToday = isSameDay(selectedDate, new Date());

    return (
        <div className="relative flex items-center justify-center bg-card rounded-2xl p-2 border border-white/5 mb-6 min-h-[80px]">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrev}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex flex-col items-center px-2 min-w-[140px]">
                    <span className="text-sm text-gray-400 capitalize">
                        {isToday ? 'Hoy' : format(selectedDate, 'eeee', { locale: es })}
                    </span>
                    <span className="text-lg font-bold text-white tracking-tight">
                        {format(selectedDate, 'd MMM yyyy', { locale: es })}
                    </span>
                </div>

                <Button variant="ghost" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {!isToday && (
                <div className="absolute right-2 sm:right-4">
                    <Button variant="secondary" size="sm" onClick={handleToday} className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
                        <span className="hidden sm:inline">Volver a </span>Hoy
                    </Button>
                </div>
            )}
        </div>
    );
};
