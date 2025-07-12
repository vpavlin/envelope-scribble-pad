
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNFC } from '@/hooks/useNFC';
import { Nfc } from 'lucide-react';

interface NFCWriterProps {
  noteId: string;
  noteTitle: string;
}

const NFCWriter: React.FC<NFCWriterProps> = ({ noteId, noteTitle }) => {
  const { writeToNFC, isWriting, isNFCSupported } = useNFC();

  const handleWriteNFC = async () => {
    const noteUrl = `${window.location.origin}/note/${noteId}`;
    await writeToNFC(noteUrl);
  };

  if (!isNFCSupported) {
    return null; // Don't show the button if NFC is not supported
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleWriteNFC}
      disabled={isWriting}
      className="flex items-center"
    >
      <Nfc className={`h-4 w-4 mr-1 ${isWriting ? "animate-pulse" : ""}`} />
      <span>{isWriting ? "Writing..." : "Write to NFC"}</span>
    </Button>
  );
};

export default NFCWriter;
