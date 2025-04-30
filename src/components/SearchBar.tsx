
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useNotes } from "@/context/NotesContext";

const SearchBar = () => {
  const { searchTerm, setSearchTerm } = useNotes();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        className="pl-9 bg-white"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
