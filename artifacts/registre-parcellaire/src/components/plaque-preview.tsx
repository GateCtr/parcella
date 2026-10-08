import React, { useRef, useState, useEffect } from 'react';

interface PlaquePreviewProps {
  parcelleNo: string;
  avenue: string;
  localite?: string | null;
  quartier: string;
  commune: string;
  isFictive?: boolean;
}

export function PlaquePreview({ parcelleNo, avenue, localite, quartier, commune, isFictive }: PlaquePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const isRue = /^rue\b/i.test(avenue.trim());
  const address = avenue.replace(/^(?:av(?:enue)?|rue)[.\s]+/i, '').trim();

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

            {/* Pied de page : Adresse (centré, sans QR) */}
            <div className="flex flex-col items-center gap-1 z-10 relative text-[38px] font-extrabold text-[#0a1f5c] uppercase tracking-tight leading-[1.05] text-center">
              <div className="whitespace-nowrap">{isRue ? 'RUE' : 'AV.'} {address}</div>
              <div className="whitespace-nowrap">LOC/ {localite?.trim() || '—'}</div>
              <div className="whitespace-nowrap">Q/ {quartier}</div>
              <div className="whitespace-nowrap">C/ {commune}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
