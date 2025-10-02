import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use the specific teacherApiService
import { TeacherApiService } from "../../services";
const apiService = new TeacherApiService();
import type { SchoolEvent } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { SportsIcon, DramaIcon, AcademicsIcon, EventsIcon, AlertTriangleIcon } from '../../components/icons/Icons.tsx';

const EventDetailModal: React.FC<{ event: SchoolEvent; onClose: () => void; }> = ({ event, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-2xl font-bold text-text-primary-dark">{event.name}</h2>
                <p className="text-text-secondary-dark">{new Date(event.date).toDateString()}</p>
                <div className="mt-4 space-y-2 text-sm">
                    <p><strong>Category:</strong> {event.category}</p>
                    <p><strong>Location:</strong> {event.location || 'N/A'}</p>
                    <p><strong>Audience:</strong> {event.audience.join(', ')}</p>
                    <p><strong>Description:</strong> {event.description || 'N/A'}</p>
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

const EventCard: React.FC<{event: SchoolEvent}> = ({ event }) => {
    const getIcon = () => {
        switch(event.category) {
            case 'Sports': return <SportsIcon className="w-5 h-5"/>;
            case 'Cultural': return <DramaIcon className="w-5 h-5"/>;
            case 'Academic': return <AcademicsIcon className="w-5 h-5"/>;
            case 'Meeting': return <EventsIcon className="w-5 h-5"/>;
            case 'Holiday': return <EventsIcon className="w-5 h-5"/>;
            default: return <AlertTriangleIcon className="w-5 h-5"/>;
        }
    };
    
    return (
        <div className="bg-slate-100 p-3 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0 bg-brand-primary/10 text-brand-primary rounded-full p-2 mt-1">
                {getIcon()}
            </div>
            <div className="flex-grow">
                <p className="font-bold text-text-primary-dark">{event.name}</p>
                <p className="text-sm text-text-secondary-dark">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-xs text-text-secondary-dark mt-1">{event.description}</p>
            </div>
        </div>
    )
}

const Events: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const data = await apiService.getSchoolEvents(user.branchId);
        setEvents(data.filter(e => e.status === 'Approved' && (e.audience.includes('All') || e.audience.includes('Staff'))));
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const eventsByDate = useMemo(() => {
        const map = new Map<string, SchoolEvent[]>();
        events.forEach(event => {
            const dateKey = event.date;
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return events
            .filter(e => new Date(e.date) >= today)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events]);

    return (
        <div>
            <h1 className="text-3xl font-bold">School Events Calendar</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <Button onClick={() => changeMonth(-1)}>&larr;</Button>
                        <h2 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        <Button onClick={() => changeMonth(1)}>&rarr;</Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-secondary-dark">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="border rounded-md bg-slate-50 min-h-[100px]"></div>)}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dateString = date.toISOString().split('T')[0];
                            const dayEvents = eventsByDate.get(dateString) || [];
                            return (
                                <div key={day} className="border rounded-md p-1 min-h-[100px] flex flex-col">
                                    <span className="font-semibold text-sm">{day}</span>
                                    <div className="flex-grow space-y-1 mt-1">
                                        {dayEvents.map(event => (
                                            <div key={event.id} onClick={() => setSelectedEvent(event)}
                                                className="flex items-center gap-1 text-xs p-1 rounded hover:bg-slate-200 cursor-pointer">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="truncate">{event.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-center p-8 text-text-secondary-dark">No upcoming events scheduled.</p>
                        ) : (
                            upcomingEvents.map(event => <EventCard key={event.id} event={event}/>)
                        )}
                    </div>
                </Card>
            </div>
            {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
        </div>
    );
};

export default Events;