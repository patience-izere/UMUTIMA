import React, { useRef, useState, useEffect } from 'react';
import { Map, Download, Image as ImageIcon, FileText, ChevronDown, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function RwandaMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportImage = async (format: 'png' | 'jpeg') => {
    if (!mapRef.current) return;
    setIsExporting(true);
    setShowMenu(false);
    try {
      const canvas = await html2canvas(mapRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement('a');
      link.download = `rwanda-map.${format === 'jpeg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!mapRef.current) return;
    setIsExporting(true);
    setShowMenu(false);
    try {
      const canvas = await html2canvas(mapRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save('rwanda-map.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative h-full min-h-[400px]">
      {/* Export Menu */}
      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            className="btn-ghost py-2 px-3 flex items-center gap-2 text-sm bg-white shadow-sm border border-light-gray disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
            {isExporting ? 'Exporting...' : 'Export'} 
            {!isExporting && <ChevronDown className="w-3 h-3" />}
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-light-gray overflow-hidden z-20">
              <button 
                onClick={() => handleExportImage('png')}
                className="w-full text-left px-4 py-2 text-sm text-rich-black hover:bg-off-white flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-dark-gray" /> As PNG
              </button>
              <button 
                onClick={() => handleExportImage('jpeg')}
                className="w-full text-left px-4 py-2 text-sm text-rich-black hover:bg-off-white flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-dark-gray" /> As JPG
              </button>
              <button 
                onClick={handleExportPDF}
                className="w-full text-left px-4 py-2 text-sm text-rich-black hover:bg-off-white flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-dark-gray" /> As PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={mapRef} className="bg-white rounded-xl shadow-sm border border-light-gray p-6 h-full flex flex-col items-center justify-center text-center pt-16">
        <div className="w-16 h-16 bg-off-white rounded-full flex items-center justify-center mb-4">
          <Map className="w-8 h-8 text-medium-gray" />
        </div>
        <h3 className="text-lg font-display font-semibold text-rich-black mb-2">District Level Data Map</h3>
        <p className="text-dark-gray max-w-sm">
          Interactive choropleth map of Rwanda showing gender data coverage and indicators by district.
        </p>
        <div className="mt-6 flex gap-4 text-sm text-dark-gray">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-light-gray"></span> No Data
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B3E5FC]"></span> Low
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rwanda-blue"></span> Medium
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rwanda-green"></span> High
          </div>
        </div>
      </div>
    </div>
  );
}
