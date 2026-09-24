import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PlaquePreviewProps {
  parcelleNo: string;
  avenue: string;
  localite?: string | null;
  quartier: string;
  commune: string;
  qrValue?: string;
  isFictive?: boolean;
}

export function PlaquePreview({ parcelleNo, avenue, localite, quartier, commune, qrValue, isFictive }: PlaquePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Safe check for 0 width
        if (entry.contentRect.width > 0) {
          const newScale = Math.min(1, entry.contentRect.width / 900);
          setScale(newScale);
        }
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center overflow-hidden py-4 print:py-0">
      <div 
        className="shrink-0 relative bg-[#0a1f5c] shadow-2xl print:shadow-none print-unscale"
        style={{
          width: '900px', 
          height: '600px', 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          marginBottom: scale < 1 ? `-${600 * (1 - scale)}px` : '0px',
          clipPath: 'polygon(30px 0, calc(100% - 30px) 0, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 30px), 0 30px)'
        }}
      >
        {/* Liseré discret aux couleurs de la RDC */}
        <div 
          className="absolute inset-[14px] bg-gradient-to-r from-[#007FFF] via-[#F7D116] to-[#CE1126]"
          style={{ clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)' }}
        >
          {/* Fond blanc principal */}
          <div 
            className="absolute inset-[4px] bg-white p-12 flex flex-col justify-between"
            style={{ clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)' }}
          >
            {/* En-tête : Drapeau et Sceau */}
            <div className="flex justify-between items-start z-10">
              <div className="w-[140px] h-[93px]">
                 <svg viewBox="0 0 120 80" overflow="hidden" xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-sm shadow-sm border border-gray-200">
                   <rect width="120" height="80" fill="#007FFF"/>
                   <g transform="translate(0, 80) rotate(-33.69) scale(1, -1)">
                     <rect x="-20" y="-12.5" width="180" height="25" fill="#F7D116"/>
                     <rect x="-20" y="-7.5" width="180" height="15" fill="#CE1126"/>
                   </g>
                   <polygon points="30,10 34,22 45,22 36,29 39,40 30,34 21,40 24,29 15,22 26,22" fill="#F7D116"/>
                 </svg>
              </div>
              <div className="w-[110px] h-[110px]">
                <img src={`${import.meta.env.BASE_URL}kinshasa-seal.png`} alt="Sceau Kinshasa" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Centre : Numéro de parcelle */}
             <div className="absolute inset-x-0 top-[120px] pointer-events-none flex justify-center">
               <div className="text-[210px] font-black text-[#0a1f5c] tracking-tighter leading-none font-sans drop-shadow-sm">
                {parcelleNo}
              </div>
            </div>

            {/* Pied de page : Adresse et QR */}
            <div className="flex justify-between items-end z-10 relative">
               <div className="flex flex-col gap-1 text-[38px] font-extrabold text-[#0a1f5c] uppercase tracking-tight leading-[1.05]">
                <div>AV. {avenue}</div>
                 <div>LO/ {localite?.trim() || '—'}</div>
                <div>Q/ {quartier}</div>
                <div>C/ {commune}</div>
              </div>
              <div className="w-[150px] h-[150px] bg-white border-[6px] border-[#0a1f5c] p-2 flex items-center justify-center shrink-0">
                {qrValue ? (
                  <QRCodeSVG value={qrValue} size={124} level="H" />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-semibold text-center p-2 uppercase border border-dashed border-gray-300">
                    {isFictive ? 'Exemple QR' : 'Non Généré'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
