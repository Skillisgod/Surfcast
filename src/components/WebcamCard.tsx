import { useEffect, useState } from 'react';
import { Camera, ExternalLink, Maximize2 } from 'lucide-react';
import type { SurfSpot } from '../types/surf';

interface Props {
  spot: SurfSpot;
}

export function WebcamCard({ spot }: Props) {
  const webcams = spot.webcams ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  // Repart sur la première caméra à chaque changement de spot
  useEffect(() => { setActiveIndex(0); }, [spot.id]);

  const active = webcams[activeIndex] ?? webcams[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
          <Camera className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-bold text-sm">Webcam en direct</p>
          <p className="text-gray-400 text-xs truncate">{spot.name}</p>
        </div>

        {spot.webcamUrl && (
          <a
            href={spot.webcamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-gray-400 active:bg-gray-100 transition-colors flex-shrink-0"
            title="Ouvrir en plein écran"
          >
            {webcams.length > 0 ? <Maximize2 className="w-4 h-4" /> : (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500 text-white text-sm font-semibold">
                Voir <ExternalLink className="w-3.5 h-3.5" />
              </span>
            )}
          </a>
        )}
        {!spot.webcamUrl && (
          <span className="text-gray-400 text-xs italic flex-shrink-0">Indisponible</span>
        )}
      </div>

      {webcams.length > 1 && (
        <div className="flex gap-1.5 px-4 sm:px-5 pb-3">
          {webcams.map((cam, i) => (
            <button
              key={cam.embedUrl}
              onClick={() => setActiveIndex(i)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                i === activeIndex
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="aspect-video bg-gray-900">
          <iframe
            key={active.embedUrl}
            src={active.embedUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            loading="lazy"
            title={`Webcam ${spot.name} – ${active.label}`}
          />
        </div>
      )}
    </div>
  );
}
