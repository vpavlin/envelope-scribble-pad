
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleWriteNFC}
      disabled={isWriting || !isNFCSupported}
      className="flex items-center"
      title={!isNFCSupported ? "NFC not supported on this device/browser" : "Write note URL to NFC tag"}
    >
      <Nfc className={`h-4 w-4 mr-1 ${isWriting ? "animate-pulse" : ""} ${!isNFCSupported ? "text-gray-400" : ""}`} />
      <span>{isWriting ? "Writing..." : "Write NFC"}</span>
    </Button>
  );
};

export default NFCWriter;
