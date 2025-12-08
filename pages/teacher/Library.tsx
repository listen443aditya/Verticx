import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth"; // Removed .ts extension for clean import
import { TeacherApiService } from "../../services";
import type { LibraryBook } from "../../types";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { LibraryIcon } from "../../components/icons/Icons";

const apiService = new TeacherApiService();

const Library: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    async (query: string) => {
      if (!user?.branchId || query.length < 2) {
        setBooks([]);
        return;
      }
      setLoading(true);
      try {
        const results = await apiService.searchLibraryBooks(
          query,
          user.branchId
        );
        setBooks(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    },
    [user?.branchId]
  );

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
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Library Catalog
      </h1>
      <Card>
        <Input
          placeholder="Search for books by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6"
        />

        {loading && (
          <p className="text-center text-slate-500 py-4">
            Searching library...
          </p>
        )}

        {!loading && searchTerm.length > 1 && books.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-secondary-dark">
              No books found matching "{searchTerm}".
            </p>
          </div>
        )}

        {!loading && searchTerm.length < 2 && (
          <div className="text-center p-12">
            <LibraryIcon className="w-16 h-16 mx-auto text-slate-300" />
            <p className="mt-4 text-text-secondary-dark">
              Enter at least 2 characters to search.
            </p>
          </div>
        )}

        {!loading && books.length > 0 && (
          <div className="space-y-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-100 hover:shadow-sm transition-all"
              >
                <div className="flex-grow">
                  <p className="font-bold text-text-primary-dark text-lg">
                    {book.title}
                  </p>
                  <p className="text-sm text-text-secondary-dark">
                    by{" "}
                    <span className="font-medium text-slate-700">
                      {book.author}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    ISBN: {book.isbn}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-white rounded border border-slate-200">
                    <p
                      className={`font-bold ${
                        book.availableCopies > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {book.availableCopies > 0 ? "Available" : "Issued Out"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {book.availableCopies} of {book.totalCopies} copies
                    </p>
                  </div>
                  {book.pdfUrl && (
                    <a
                      href={book.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 text-xs"
                      >
                        View PDF
                      </Button>
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
