
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useNFC = () => {
  const [isWriting, setIsWriting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const { toast } = useToast();

  const checkNFCSupport = () => {
    if (!('NDEFReader' in window)) {
      toast({
        title: "NFC not supported",
        description: "NFC is not supported on this device or browser",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const writeToNFC = async (url: string) => {
    if (!checkNFCSupport()) return false;

    setIsWriting(true);
    try {
      const ndef = new (window as any).NDEFReader();
      
      await ndef.write({
        records: [{
          recordType: "url",
          data: url
        }]
      });

      toast({
        title: "NFC tag written successfully",
        description: "The note URL has been written to the NFC tag"
      });
      
      return true;
    } catch (error: any) {
      console.error('NFC write error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "NFC permission denied",
          description: "Please allow NFC access to write to tags",
          variant: "destructive"
        });
      } else if (error.name === 'NetworkError') {
        toast({
          title: "NFC write failed",
          description: "No NFC tag found. Please tap an NFC tag to write.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "NFC write error",
          description: "Failed to write to NFC tag: " + error.message,
          variant: "destructive"
        });
      }
      
      return false;
    } finally {
      setIsWriting(false);
    }
  };

  const readFromNFC = async () => {
    if (!checkNFCSupport()) return null;

    setIsReading(true);
    try {
      const ndef = new (window as any).NDEFReader();
      
      await ndef.scan();
      
      return new Promise((resolve) => {
        ndef.addEventListener('reading', (event: any) => {
          const record = event.message.records[0];
          if (record.recordType === 'url') {
            const url = new TextDecoder().decode(record.data);
            resolve(url);
          }
          setIsReading(false);
        });
      });
    } catch (error: any) {
      console.error('NFC read error:', error);
      toast({
        title: "NFC read error",
        description: "Failed to read NFC tag: " + error.message,
        variant: "destructive"
      });
      setIsReading(false);
      return null;
    }
  };

  return {
    writeToNFC,
    readFromNFC,
    isWriting,
    isReading,
    isNFCSupported: 'NDEFReader' in window
  };
};
