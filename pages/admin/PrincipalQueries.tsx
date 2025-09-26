import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { adminApiService } from '../../services';
import type { PrincipalQuery } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

const ResolveQueryModal: React.FC<{
    query: PrincipalQuery;
    onClose: () => void;
    onSave: () => void;
}> = ({ query, onClose, onSave }) => {
    const { user } = useAuth();
    const [adminNotes, setAdminNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminNotes || !user) return;
        setIsSaving(true);
        await adminApiService.resolvePrincipalQuery(query.id, adminNotes, user.id);
        setIsSaving(false);
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">Resolve Principal Query</h2>
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg mb-4">
                    <p><strong>From:</strong> {query.principalName} ({query.schoolName})</p>
                    <p><strong>Subject:</strong> {query.subject}</p>
                    <p className="text-sm whitespace-pre-wrap border-t pt-2 mt-2">"{query.queryText}"</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Your Resolution Notes</label>
                        <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            rows={4}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving || !adminNotes}>
                            {isSaving ? 'Saving...' : 'Mark as Resolved'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const PrincipalQueries: React.FC = () => {
    const [queries, setQueries] = useState<PrincipalQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'Open' | 'Resolved'>('Open');
    const [resolvingQuery, setResolvingQuery] = useState<PrincipalQuery | null>(null);
    const { refreshKey, triggerRefresh } = useDataRefresh();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await adminApiService.getPrincipalQueries();
        setQueries(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const filteredQueries = useMemo(() => {
        return queries.filter(q => q.status === view);
    }, [queries, view]);

    const viewButtonClasses = (isActive: boolean) =>
        `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${isActive ? 'border-b-2 border-brand-secondary text-brand-secondary' : 'text-text-secondary-dark hover:text-text-primary-dark'}`;

    const handleSave = () => {
        setResolvingQuery(null);
        triggerRefresh();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Principal Queries</h1>
            <Card>
                <div className="flex justify-end mb-4">
                    <div className="flex border rounded-lg overflow-hidden">
                        <button className={viewButtonClasses(view === 'Open')} onClick={() => setView('Open')}>Open</button>
                        <button className={viewButtonClasses(view === 'Resolved')} onClick={() => setView('Resolved')}>Resolved</button>
                    </div>
                </div>
                {loading ? <p>Loading queries...</p> : (
                    filteredQueries.length === 0 ? (
                        <p className="text-center text-text-secondary-dark p-8">No {view.toLowerCase()} queries found.</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredQueries.map(query => (
                                <details key={query.id} className="bg-slate-50 p-4 rounded-lg" open={view === 'Open'}>
                                    <summary className="cursor-pointer font-semibold text-text-primary-dark flex justify-between items-center">
                                        <div>
                                            <p>{query.subject}</p>
                                            <p className="text-xs font-normal text-text-secondary-dark">From: {query.principalName} ({query.schoolName}) | Submitted: {new Date(query.submittedAt).toLocaleString()}</p>
                                        </div>
                                        {view === 'Open' && (
                                            <Button onClick={(e) => { e.preventDefault(); setResolvingQuery(query); }}>Resolve</Button>
                                        )}
                                    </summary>
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="text-sm text-text-primary-dark whitespace-pre-wrap">{query.queryText}</p>
                                        {query.status === 'Resolved' && (
                                            <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-400">
                                                <p className="font-semibold text-sm text-green-800">Resolved by {query.resolvedBy} on {new Date(query.resolvedAt!).toLocaleDateString()}:</p>
                                                <p className="text-sm italic text-green-900">"{query.adminNotes}"</p>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            ))}
                        </div>
                    )
                )}
            </Card>
            {resolvingQuery && (
                <ResolveQueryModal
                    query={resolvingQuery}
                    onClose={() => setResolvingQuery(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default PrincipalQueries;