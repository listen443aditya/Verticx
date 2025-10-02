import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth.ts";
import { LibrarianApiService } from "../../services";
import type { LibraryBook } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.tsx";
import { BarcodeIcon } from "../../components/icons/Icons.tsx";

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
            placeholder="Scan or enter ISBN"
            icon={<BarcodeIcon className="h-5 w-5 text-slate-400" />}
          />
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
    // FIX: Provided the mandatory branchId argument.
    const data = await apiService.getLibraryBooks(user.branchId);
    setBooks(data);
    setLoading(false);
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
    if (bookData.id) {
      await apiService.updateBook(bookData.id, bookData, pdfFile);
    } else {
      // FIX: Provided the mandatory branchId argument.
      await apiService.createBook(user.branchId, bookData, pdfFile);
    }
    setIsActionLoading(false);
    setModal(null);
    setSelectedBook(null);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    setIsActionLoading(true);
    try {
      await apiService.deleteBook(deletingBook.id);
    } catch (error: any) {
      alert(error.message); // Show error to user
    }
    setIsActionLoading(false);
    setDeletingBook(null);
    await fetchData();
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
      <h1 className="text-3xl font-bold mb-6">Book Catalog Management</h1>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-1/2"
          />
          <Button onClick={() => setModal("add")}>Add New Book</Button>
        </div>
        {loading ? (
          <p>Loading books...</p>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left">
              <thead className="border-b sticky top-0 bg-surface-dark">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">ISBN</th>
                  <th className="p-4 text-center">Available / Total</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium">{book.title}</td>
                    <td className="p-4">{book.author}</td>
                    <td className="p-4 font-mono text-xs">{book.isbn}</td>
                    <td className="p-4 text-center font-semibold">
                      {book.availableCopies} / {book.totalCopies}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {book.price?.toFixed(2) || "N/A"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => {
                            setSelectedBook(book);
                            setModal("edit");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => setDeletingBook(book)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(modal === "add" || (modal === "edit" && selectedBook)) && (
        <BookFormModal
          book={selectedBook}
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
