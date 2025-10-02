import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use the specific studentApiService
import { StudentApiService } from "../../services";
import type { LibraryBook } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Input from '../../components/ui/Input.tsx';
import Button from '../../components/ui/Button.tsx';
import { LibraryIcon } from '../../components/icons/Icons.tsx';
const apiService = new StudentApiService();

const Library: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(false);
    
    const performSearch = useCallback(async (query: string) => {
        if (!user?.branchId || query.length < 2) {
            setBooks([]);
            return;
        }
        setLoading(true);
        const results = await apiService.searchLibraryBooks( query);
        setBooks(results);
        setLoading(false);
    }, [user?.branchId]);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, performSearch]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Library Catalog</h1>
            <Card>
                <Input
                    placeholder="Search for books by title, author, or ISBN..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mb-6"
                />

                {loading && <p>Searching...</p>}
                
                {!loading && searchTerm.length > 1 && books.length === 0 && (
                    <p className="text-center text-text-secondary-dark p-8">No books found matching your search.</p>
                )}

                {!loading && searchTerm.length < 2 && (
                     <div className="text-center p-12">
                        <LibraryIcon className="w-16 h-16 mx-auto text-slate-300" />
                        <p className="mt-4 text-text-secondary-dark">Enter at least 2 characters to search for a book.</p>
                    </div>
                )}
                
                {!loading && books.length > 0 && (
                    <div className="space-y-4">
                        {books.map(book => (
                            <div key={book.id} className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-grow">
                                    <p className="font-bold text-text-primary-dark">{book.title}</p>
                                    <p className="text-sm text-text-secondary-dark">by {book.author}</p>
                                    <p className="text-xs text-text-secondary-dark mt-1 font-mono">ISBN: {book.isbn}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-4">
                                    <div className="text-center">
                                        <p className={`font-semibold ${book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'}`}>{book.availableCopies > 0 ? 'Available' : 'Issued'}</p>
                                        <p className="text-xs text-text-secondary-dark">({book.availableCopies}/{book.totalCopies} copies)</p>
                                    </div>
                                    {book.pdfUrl && (
                                        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                                            <Button>View PDF</Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Library;