import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LibrarianApiService } from "../../services/librarianApiService";
import type { LibraryBook } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { BarcodeIcon } from "../../components/icons/Icons";

const apiService = new LibrarianApiService();

const BookFormModal: React.FC<{
  book: Partial<LibraryBook> | null;
  onClose: () => void;
  onSave: (bookData: Partial<LibraryBook>, pdfFile: File | null) => void;
}> = ({ book, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<LibraryBook>>({
    title: "",
    author: "",
    isbn: "",
    totalCopies: 1,
    price: 0,
    ...book,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- BARCODE SCANNER LISTENER ---
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = 0;
    const SCAN_THRESHOLD = 60; // ms

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If user is focused on an input other than ISBN, let them type normally.
      // However, if they are just staring at the screen, capture the scan.
      const target = e.target as HTMLElement;

      // Calculate typing speed
      const now = Date.now();
      if (now - lastKeyTime > SCAN_THRESHOLD) {
        barcodeBuffer = ""; // Reset if too slow (manual typing)
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        // If it looks like a barcode (fast entry, sufficient length)
        if (barcodeBuffer.length >= 3) {
          e.preventDefault(); // Stop form submission
          e.stopPropagation();

          // AUTO-FILL ISBN
          setFormData((prev) => ({ ...prev, isbn: barcodeBuffer }));
        }
        barcodeBuffer = "";
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "totalCopies" || name === "price" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData, pdfFile);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {book?.id ? "Edit Book" : "Add New Book"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Book Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            autoFocus // Focus title first so they can type name, then scan ISBN easily
          />
          <Input
            label="Author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
          <Input
            label="ISBN"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            required
            placeholder="Scan barcode or enter manually"
            // Tooltip to inform user
            title="Scan a barcode anywhere on this screen to auto-fill this field."
            icon={<BarcodeIcon className="h-5 w-5 text-slate-400" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Copies"
              name="totalCopies"
              type="number"
              min="1"
              value={formData.totalCopies}
              onChange={handleChange}
              required
            />
            <Input
              label="Price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price || ""}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Upload PDF (Optional)"
            type="file"
            name="pdfFile"
            accept=".pdf"
            onChange={handleFileChange}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Book"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const BookManagement: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [deletingBook, setDeletingBook] = useState<LibraryBook | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const data = await apiService.getLibraryBooks(user.branchId);
      setBooks(data);
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (
    bookData: Partial<LibraryBook>,
    pdfFile: File | null
  ) => {
    if (!user?.branchId) return;
    setIsActionLoading(true);
    try {
      if (bookData.id) {
        await apiService.updateBook(bookData.id, bookData, pdfFile);
      } else {
        await apiService.createBook(user.branchId, bookData, pdfFile);
      }
      setModal(null);
      setSelectedBook(null);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to save book");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    setIsActionLoading(true);
    try {
      await apiService.deleteBook(deletingBook.id);
      await fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsActionLoading(false);
      setDeletingBook(null);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    const lowercasedTerm = searchTerm.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(lowercasedTerm) ||
        b.author.toLowerCase().includes(lowercasedTerm) ||
        b.isbn.toLowerCase().includes(lowercasedTerm)
    );
  }, [books, searchTerm]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-text-primary-dark">
        Book Catalog
      </h1>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-1/2"
            icon={<BarcodeIcon className="h-5 w-5 text-slate-400" />}
          />
          <Button
            onClick={() => {
              setSelectedBook(null);
              setModal("add");
            }}
          >
            Add New Book
          </Button>
        </div>
        {loading ? (
          <p>Loading books...</p>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left">
              <thead className="border-b sticky top-0 bg-white shadow-sm z-10">
                <tr className="bg-slate-50">
                  <th className="p-4 font-semibold text-slate-700">Title</th>
                  <th className="p-4 font-semibold text-slate-700">Author</th>
                  <th className="p-4 font-semibold text-slate-700">ISBN</th>
                  <th className="p-4 text-center font-semibold text-slate-700">
                    Available / Total
                  </th>
                  <th className="p-4 text-right font-semibold text-slate-700">
                    Price
                  </th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {book.title}
                    </td>
                    <td className="p-4 text-slate-600">{book.author}</td>
                    <td className="p-4 font-medium text-xs text-slate-500 px-2 py-1 rounded w-fit">
                      {book.isbn}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`font-bold ${
                          book.availableCopies > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {book.availableCopies}
                      </span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-700">{book.totalCopies}</span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-700">
                      {book.price ? book.price.toFixed(2) : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 text-xs border-slate-200"
                          onClick={() => {
                            setSelectedBook(book);
                            setModal("edit");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => setDeletingBook(book)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No books found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(modal === "add" || (modal === "edit" && selectedBook)) && (
        <BookFormModal
          book={selectedBook || null}
          onClose={() => {
            setModal(null);
            setSelectedBook(null);
          }}
          onSave={handleSave}
        />
      )}

      {deletingBook && (
        <ConfirmationModal
          isOpen={!!deletingBook}
          onClose={() => setDeletingBook(null)}
          onConfirm={handleDelete}
          title="Confirm Book Deletion"
          message={
            <>
              Are you sure you want to delete "
              <strong>{deletingBook.title}</strong>"? This action cannot be
              undone.
            </>
          }
          isConfirming={isActionLoading}
        />
      )}
    </div>
  );
};

export default BookManagement;
