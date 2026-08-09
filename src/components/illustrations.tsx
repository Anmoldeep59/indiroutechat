/**
 * IndiRoute illustration library.
 * Flat, lightweight inline SVG art in the brand palette:
 * navy #0c2340, saffron #e86a17, green #147a54, gold #d4a017.
 * Every element is decorative (aria-hidden) unless labelled.
 */

type IllustrationProps = {
  className?: string;
};

/* Simplified India outline with warehouse hub dot. */
export function IndiaMap({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 112" className={className} aria-hidden="true">
      <path
        d="M38 6l8-4 6 6 6 2-2 8 4 4 10-2 8-6 4 6-6 8-6 4 2 6-8 4-4 10-6 12-4 14-4 12-4-10-4-10-6-8-6-6-8-4 4-8 6-4 2-10 4-8z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="98" r="3" fill="currentColor" fillOpacity="0.25" />
      <circle cx="46" cy="46" r="5" fill="#e86a17" opacity="0.25" className="route-node" />
      <circle cx="46" cy="46" r="2.5" fill="#e86a17" />
    </svg>
  );
}

/* Decorated Indian cargo truck carrying IndiRoute boxes. */
export function IndianTruck({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 120" className={className} aria-hidden="true">
      <ellipse cx="120" cy="107" rx="102" ry="4.5" fill="#0c2340" opacity="0.08" />

      {/* cargo body */}
      <rect x="16" y="24" width="128" height="62" rx="6" fill="#0c2340" />
      <rect x="16" y="24" width="128" height="10" rx="5" fill="#e86a17" />
      {/* block-print inspired band */}
      <g fill="#e86a17" opacity="0.85">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${26 + i * 11} 80l4.5-5.5 4.5 5.5z`} />
        ))}
      </g>
      <text
        x="80"
        y="58"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="14"
        fontWeight="700"
      >
        IndiRoute
      </text>
      <text
        x="80"
        y="70"
        textAnchor="middle"
        fill="#ffffff"
        opacity="0.55"
        fontSize="5.5"
        letterSpacing="1.5"
      >
        SHOP INDIA · SHIP ANYWHERE
      </text>
      {/* tiny homage detail */}
      <text
        x="30"
        y="94"
        fill="#3a4f6a"
        fontSize="5"
        letterSpacing="1"
        fontWeight="600"
      >
        HORN OK PLEASE
      </text>

      {/* cab */}
      <path
        d="M144 38h32c2.8 0 5.4 1.3 7 3.6l10.4 14.2c1.7 2.3 2.6 5.1 2.6 8V80c0 3.3-2.7 6-6 6h-46V38z"
        fill="#e86a17"
      />
      <path d="M150 44h24l8.6 12H150z" fill="#eaf1f8" />
      <rect x="188" y="78" width="10" height="7" rx="2" fill="#0c2340" opacity="0.35" />
      <rect x="144" y="66" width="20" height="3" rx="1.5" fill="#ffffff" opacity="0.35" />

      {/* wheels */}
      <g>
        <circle cx="52" cy="94" r="12" fill="#0c2340" />
        <circle cx="52" cy="94" r="5.5" fill="#f4f6f9" />
        <g className="truck-wheel" stroke="#0c2340" strokeWidth="1.5">
          <line x1="52" y1="89.5" x2="52" y2="98.5" />
          <line x1="47.5" y1="94" x2="56.5" y2="94" />
        </g>
      </g>
      <g>
        <circle cx="168" cy="94" r="12" fill="#0c2340" />
        <circle cx="168" cy="94" r="5.5" fill="#f4f6f9" />
        <g className="truck-wheel" stroke="#0c2340" strokeWidth="1.5">
          <line x1="168" y1="89.5" x2="168" y2="98.5" />
          <line x1="163.5" y1="94" x2="172.5" y2="94" />
        </g>
      </g>
    </svg>
  );
}

/* IndiRoute warehouse with racks and parcels. */
export function WarehouseIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 130" className={className} aria-hidden="true">
      <ellipse cx="100" cy="124" rx="88" ry="4" fill="#0c2340" opacity="0.08" />
      {/* roof */}
      <path
        d="M14 46L100 14l86 32"
        fill="none"
        stroke="#e86a17"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* body */}
      <rect x="24" y="46" width="152" height="76" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* rolling door */}
      <rect x="78" y="70" width="44" height="52" rx="3" fill="#0c2340" fillOpacity="0.08" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
      <g stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5">
        <line x1="80" y1="82" x2="120" y2="82" />
        <line x1="80" y1="94" x2="120" y2="94" />
        <line x1="80" y1="106" x2="120" y2="106" />
      </g>
      {/* racks with parcels */}
      <g stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.5">
        <line x1="34" y1="88" x2="68" y2="88" />
        <line x1="34" y1="108" x2="68" y2="108" />
        <line x1="132" y1="88" x2="166" y2="88" />
        <line x1="132" y1="108" x2="166" y2="108" />
      </g>
      <g>
        <rect x="38" y="76" width="11" height="11" rx="1.5" fill="#e86a17" opacity="0.85" />
        <rect x="53" y="78" width="9" height="9" rx="1.5" fill="#0c2340" opacity="0.5" />
        <rect x="40" y="97" width="10" height="10" rx="1.5" fill="#0c2340" opacity="0.35" />
        <rect x="136" y="77" width="10" height="10" rx="1.5" fill="#0c2340" opacity="0.5" />
        <rect x="150" y="79" width="8" height="8" rx="1.5" fill="#e86a17" opacity="0.7" />
        <rect x="140" y="98" width="11" height="10" rx="1.5" fill="#e86a17" opacity="0.85" />
      </g>
      {/* sign */}
      <rect x="70" y="52" width="60" height="12" rx="3" fill="#0c2340" />
      <text x="100" y="61" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="700">
        IndiRoute
      </text>
      {/* pin */}
      <g className="animate-float-soft">
        <path
          d="M100 0c-5 0-9 4-9 9 0 6.5 9 14 9 14s9-7.5 9-14c0-5-4-9-9-9z"
          fill="#e86a17"
          transform="translate(0 -8) scale(0.85) translate(18 8)"
        />
      </g>
    </svg>
  );
}

/* Cardboard parcel with tape + label. */
export function ParcelBox({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="8" y="16" width="48" height="40" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="2" />
      <rect x="29" y="16" width="6" height="40" fill="#e86a17" opacity="0.75" />
      <rect x="8" y="16" width="48" height="9" rx="4" fill="#0c2340" fillOpacity="0.06" />
      <rect x="38" y="40" width="12" height="9" rx="1.5" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
      <g stroke="#0c2340" strokeOpacity="0.45" strokeWidth="1.2">
        <line x1="40" y1="43" x2="48" y2="43" />
        <line x1="40" y1="46" x2="45" y2="46" />
      </g>
    </svg>
  );
}

/* Three parcels merging into one consolidated box. */
export function ConsolidationVisual({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 220 90" className={className} aria-hidden="true">
      <g>
        <rect x="10" y="12" width="26" height="22" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.75" />
        <line x1="23" y1="12" x2="23" y2="34" stroke="#e86a17" strokeWidth="2.5" opacity="0.7" />
        <rect x="16" y="42" width="24" height="20" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.75" />
        <line x1="28" y1="42" x2="28" y2="62" stroke="#e86a17" strokeWidth="2.5" opacity="0.7" />
        <rect x="44" y="26" width="22" height="20" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.75" />
        <line x1="55" y1="26" x2="55" y2="46" stroke="#e86a17" strokeWidth="2.5" opacity="0.7" />
      </g>

      <g stroke="#e86a17" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M78 38h28m0 0l-7-7m7 7l-7 7" className="route-line" />
      </g>

      <g>
        <rect x="122" y="16" width="60" height="50" rx="5" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.45" strokeWidth="2" />
        <rect x="148" y="16" width="8" height="50" fill="#e86a17" opacity="0.8" />
        <rect x="130" y="48" width="16" height="11" rx="1.5" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.25" />
        <circle cx="196" cy="26" r="11" fill="#147a54" />
        <path d="M191.5 26l3 3 6-6" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* Numbered locker rack with a highlighted customer slot. */
export function LockerRack({ className = "" }: IllustrationProps) {
  const slots = [
    { x: 8, y: 8 },
    { x: 66, y: 8 },
    { x: 124, y: 8 },
    { x: 8, y: 56 },
    { x: 66, y: 56, highlight: true },
    { x: 124, y: 56 },
    { x: 8, y: 104 },
    { x: 66, y: 104 },
    { x: 124, y: 104 },
  ];

  return (
    <svg viewBox="0 0 180 156" className={className} aria-hidden="true">
      {slots.map((slot, i) =>
        slot.highlight ? (
          <g key={i}>
            <rect
              x={slot.x}
              y={slot.y}
              width="48"
              height="40"
              rx="5"
              fill="#e86a17"
              opacity="0.14"
              stroke="#e86a17"
              strokeWidth="2"
            />
            <text
              x={slot.x + 24}
              y={slot.y + 20}
              textAnchor="middle"
              fill="#e86a17"
              fontSize="11"
              fontWeight="700"
            >
              IR
            </text>
            <rect x={slot.x + 14} y={slot.y + 26} width="20" height="8" rx="1.5" fill="#e86a17" opacity="0.65" />
          </g>
        ) : (
          <g key={i}>
            <rect
              x={slot.x}
              y={slot.y}
              width="48"
              height="40"
              rx="5"
              fill="#0c2340"
              fillOpacity="0.04"
              stroke="#0c2340"
              strokeOpacity="0.22"
              strokeWidth="1.5"
            />
            <rect
              x={slot.x + 15}
              y={slot.y + 24}
              width="18"
              height="10"
              rx="1.5"
              fill="#0c2340"
              opacity="0.18"
            />
          </g>
        ),
      )}
    </svg>
  );
}

/* Diwali diya with flickering flame. */
export function Diya({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g className="animate-flicker">
        <path d="M24 10c3.5 4 3.5 8 0 11-3.5-3-3.5-7 0-11z" fill="#e86a17" />
        <path d="M24 14c1.8 2.2 1.8 4.5 0 6.2-1.8-1.7-1.8-4 0-6.2z" fill="#ffd9a0" />
      </g>
      <path d="M8 28c0 7 7.2 12 16 12s16-5 16-12c-5 2.5-10.5 3.8-16 3.8S13 30.5 8 28z" fill="#0c2340" />
      <ellipse cx="24" cy="28.5" rx="14" ry="3.4" fill="#e86a17" opacity="0.85" />
    </svg>
  );
}

/* Diwali string lights (used along section tops). */
export function StringLights({ className = "" }: IllustrationProps) {
  const bulbs = [
    { x: 30, color: "#e86a17" },
    { x: 75, color: "#d4a017" },
    { x: 120, color: "#147a54" },
    { x: 165, color: "#e86a17" },
    { x: 210, color: "#d4a017" },
    { x: 255, color: "#147a54" },
    { x: 300, color: "#e86a17" },
    { x: 345, color: "#d4a017" },
  ];

  return (
    <svg viewBox="0 0 380 44" className={className} aria-hidden="true" preserveAspectRatio="xMidYMin meet">
      <path
        d="M0 8c48 18 92 18 140 0 48 18 92 18 140 0 40 15 68 16 100 4"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {bulbs.map((bulb, i) => (
        <g key={i} className="animate-flicker" style={{ animationDelay: `${i * 0.35}s` }}>
          <line
            x1={bulb.x}
            y1={i % 2 === 0 ? 15 : 17}
            x2={bulb.x}
            y2={i % 2 === 0 ? 22 : 24}
            stroke="#ffffff"
            strokeOpacity="0.35"
          />
          <circle cx={bulb.x} cy={i % 2 === 0 ? 27 : 29} r="4.5" fill={bulb.color} opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

/* Postage-stamp inspired decoration with cargo plane. */
export function PostalStamp({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 110 130" className={className} aria-hidden="true">
      <rect
        x="6"
        y="6"
        width="98"
        height="118"
        rx="4"
        fill="#ffffff"
        stroke="#0c2340"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <rect x="16" y="16" width="78" height="72" rx="3" fill="#0c2340" fillOpacity="0.05" />
      <path
        d="M28 62l38-18-11 15 11 15z"
        fill="#e86a17"
        opacity="0.9"
        transform="rotate(-8 47 55)"
      />
      <path d="M26 74c14-8 40-8 58-2" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.5" fill="none" strokeDasharray="3 4" />
      <text x="55" y="104" textAnchor="middle" fill="#0c2340" fillOpacity="0.7" fontSize="9" fontWeight="700" letterSpacing="1.5">
        INDIROUTE
      </text>
      <text x="55" y="116" textAnchor="middle" fill="#e86a17" fontSize="7" fontWeight="600" letterSpacing="1.5">
        AIR MAIL · हवाई डाक
      </text>
    </svg>
  );
}

/* Barcode + tracking label decoration. */
export function BarcodeDecor({ className = "" }: IllustrationProps) {
  const bars = [3, 1.5, 2.5, 1, 3.5, 1.5, 1, 2.5, 1.5, 3, 1, 2, 3.5, 1.5, 2.5, 1, 2, 3];
  let x = 0;
  return (
    <svg viewBox="0 0 92 34" className={className} aria-hidden="true">
      {bars.map((width, i) => {
        const bar = <rect key={i} x={x} y={0} width={width} height={24} fill="currentColor" />;
        x += width + 2.2;
        return bar;
      })}
      <text x="0" y="33" fill="currentColor" fontSize="7" letterSpacing="3" fontWeight="600">
        IR·TRACKED
      </text>
    </svg>
  );
}

/* Rangoli-inspired mandala, used as a very low-opacity background motif. */
export function RangoliMotif({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="100" cy="100" r="28" />
        <circle cx="100" cy="100" r="56" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="84" />
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="58"
            rx="10"
            ry="24"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={`d${i}`}
            cx="100"
            cy="16"
            r="3"
            transform={`rotate(${i * 45} 100 100)`}
          />
        ))}
      </g>
    </svg>
  );
}

/* Indian shop front with striped awning (assisted purchase). */
export function ShopFront({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <rect x="14" y="34" width="92" height="52" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.75" />
      {/* scalloped awning */}
      <path d="M10 22h100v10c0 0-4 8-10 8s-10-8-10-8-4 8-10 8-10-8-10-8-4 8-10 8-10-8-10-8-4 8-10 8-10-8-10-8-4 8-10 8-10-8-10-8V22z" fill="#e86a17" opacity="0.9" />
      <rect x="10" y="16" width="100" height="8" rx="3" fill="#0c2340" />
      <rect x="24" y="48" width="26" height="38" rx="3" fill="#0c2340" fillOpacity="0.08" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
      <rect x="60" y="48" width="36" height="22" rx="3" fill="#0c2340" fillOpacity="0.05" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
      <text x="78" y="62" textAnchor="middle" fill="#e86a17" fontSize="12" fontWeight="700">₹</text>
      <rect x="60" y="76" width="14" height="10" rx="2" fill="#e86a17" opacity="0.7" />
      <rect x="78" y="78" width="12" height="8" rx="2" fill="#0c2340" opacity="0.3" />
    </svg>
  );
}

/* Pickup van collecting a parcel (India pickup). */
export function PickupVan({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 76" className={className} aria-hidden="true">
      <ellipse cx="70" cy="70" rx="58" ry="3" fill="#0c2340" opacity="0.08" />
      <path d="M14 26h58c3.3 0 6 2.7 6 6v26H8V32c0-3.3 2.7-6 6-6z" fill="#0c2340" />
      <text x="43" y="46" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="700">IndiRoute</text>
      <path d="M78 34h20l12 12v12H78V34z" fill="#e86a17" />
      <path d="M82 38h13l8 8H82z" fill="#eaf1f8" />
      <g>
        <circle cx="30" cy="60" r="8" fill="#0c2340" />
        <circle cx="30" cy="60" r="3.5" fill="#f4f6f9" />
      </g>
      <g>
        <circle cx="94" cy="60" r="8" fill="#0c2340" />
        <circle cx="94" cy="60" r="3.5" fill="#f4f6f9" />
      </g>
      {/* parcel waiting */}
      <rect x="118" y="44" width="16" height="14" rx="2" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="126" y1="44" x2="126" y2="58" stroke="#e86a17" strokeWidth="2" opacity="0.75" />
    </svg>
  );
}

/* Globe with route arc (forwarding / worldwide). */
export function GlobeRoute({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <circle cx="76" cy="46" r="30" fill="none" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.75" />
      <path d="M46 46h60M76 16a44 44 0 010 60M76 16a44 44 0 000 60" fill="none" stroke="#0c2340" strokeOpacity="0.22" strokeWidth="1.25" />
      <path d="M14 66C28 34 52 22 88 26" fill="none" stroke="#e86a17" strokeWidth="2" strokeLinecap="round" className="route-line" />
      <circle cx="14" cy="66" r="4" fill="#e86a17" />
      <circle cx="88" cy="26" r="6" fill="#e86a17" opacity="0.2" className="route-node" />
      <circle cx="88" cy="26" r="3" fill="#e86a17" />
      <path d="M46 44l14-6-4 6 4 6z" fill="#e86a17" opacity="0.9" transform="rotate(-16 52 44)" />
    </svg>
  );
}

/* Address card with locker code + India pin (step 1). */
export function AddressCardVisual({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 88" className={className} aria-hidden="true">
      <rect x="8" y="14" width="94" height="62" rx="6" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.75" />
      <rect x="8" y="14" width="94" height="12" rx="6" fill="#0c2340" />
      <text x="16" y="23" fill="#ffffff" fontSize="6.5" fontWeight="700" letterSpacing="1">MY INDIA ADDRESS</text>
      <rect x="16" y="34" width="42" height="4.5" rx="2" fill="#0c2340" opacity="0.25" />
      <rect x="16" y="44" width="56" height="4.5" rx="2" fill="#0c2340" opacity="0.15" />
      <rect x="16" y="54" width="48" height="4.5" rx="2" fill="#0c2340" opacity="0.15" />
      <rect x="16" y="63" width="34" height="8" rx="2.5" fill="#e86a17" opacity="0.15" stroke="#e86a17" strokeWidth="1" />
      <text x="33" y="69.5" textAnchor="middle" fill="#e86a17" fontSize="5.5" fontWeight="700" letterSpacing="0.5">LOCKER IR-XXXXXX</text>
      <g className="animate-float-soft">
        <path d="M112 22c-6 0-11 5-11 11 0 8 11 17 11 17s11-9 11-17c0-6-5-11-11-11z" fill="#e86a17" />
        <circle cx="112" cy="33" r="4.5" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* Shopping bag with rupee tag + parcels (step 2). */
export function ShoppingVisual({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 88" className={className} aria-hidden="true">
      <path d="M28 34h48l-4 46H32l-4-46z" fill="#e86a17" opacity="0.9" />
      <path d="M40 40v-8c0-6.6 5.4-12 12-12s12 5.4 12 12v8" fill="none" stroke="#0c2340" strokeWidth="2.5" strokeLinecap="round" />
      <text x="52" y="62" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="700">₹</text>
      <rect x="86" y="46" width="26" height="22" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.4" strokeWidth="1.75" />
      <line x1="99" y1="46" x2="99" y2="68" stroke="#e86a17" strokeWidth="2.5" opacity="0.75" />
      <rect x="92" y="24" width="18" height="16" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.4" strokeWidth="1.75" />
      <line x1="101" y1="24" x2="101" y2="40" stroke="#147a54" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}

/* Cargo plane with parcel over globe arc (step 4). */
export function DeliveryVisual({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 88" className={className} aria-hidden="true">
      <path d="M10 74a80 80 0 01110 0" fill="none" stroke="#0c2340" strokeOpacity="0.2" strokeWidth="1.75" strokeDasharray="4 6" />
      <path d="M18 46C40 22 78 14 112 26" fill="none" stroke="#e86a17" strokeWidth="2" strokeLinecap="round" className="route-line" />
      <g className="animate-float-soft">
        <path d="M52 30l30-12-8.5 12 8.5 12z" fill="#e86a17" transform="rotate(-10 67 30)" />
      </g>
      <circle cx="18" cy="46" r="4" fill="#0c2340" opacity="0.6" />
      <circle cx="112" cy="26" r="7" fill="#147a54" opacity="0.2" className="route-node" />
      <circle cx="112" cy="26" r="3.5" fill="#147a54" />
      <rect x="98" y="58" width="20" height="17" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.4" strokeWidth="1.75" />
      <line x1="108" y1="58" x2="108" y2="75" stroke="#e86a17" strokeWidth="2" opacity="0.75" />
    </svg>
  );
}

/* Warehouse racks + scanner (step 3). */
export function WarehouseStepVisual({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 88" className={className} aria-hidden="true">
      <g stroke="#0c2340" strokeOpacity="0.35" strokeWidth="2">
        <line x1="12" y1="30" x2="66" y2="30" />
        <line x1="12" y1="56" x2="66" y2="56" />
        <line x1="12" y1="82" x2="66" y2="82" />
        <line x1="14" y1="24" x2="14" y2="84" />
        <line x1="64" y1="24" x2="64" y2="84" />
      </g>
      <rect x="20" y="18" width="14" height="11" rx="1.5" fill="#e86a17" opacity="0.85" />
      <rect x="40" y="20" width="12" height="9" rx="1.5" fill="#0c2340" opacity="0.4" />
      <rect x="22" y="44" width="13" height="11" rx="1.5" fill="#0c2340" opacity="0.4" />
      <rect x="42" y="46" width="12" height="9" rx="1.5" fill="#e86a17" opacity="0.7" />
      <rect x="24" y="70" width="14" height="11" rx="1.5" fill="#e86a17" opacity="0.85" />
      {/* scan beam + parcel */}
      <rect x="86" y="44" width="30" height="26" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.4" strokeWidth="1.75" />
      <line x1="101" y1="44" x2="101" y2="70" stroke="#e86a17" strokeWidth="2.5" opacity="0.75" />
      <line x1="80" y1="38" x2="122" y2="38" stroke="#147a54" strokeWidth="1.75" strokeDasharray="3 4" className="route-line" />
      <path d="M96 18l10 0 0 6" fill="none" stroke="#147a54" strokeWidth="2" strokeLinecap="round" />
      <g stroke="#0c2340" strokeOpacity="0.5" strokeWidth="1.25">
        <line x1="90" y1="58" x2="90" y2="66" />
        <line x1="93" y1="58" x2="93" y2="66" />
        <line x1="96" y1="58" x2="96" y2="66" />
      </g>
    </svg>
  );
}

/* Simple home + delivered parcel. */
export function HomeDelivered({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 90 76" className={className} aria-hidden="true">
      <path d="M12 38L45 12l33 26" fill="none" stroke="#e86a17" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="20" y="38" width="50" height="32" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.75" />
      <rect x="38" y="50" width="14" height="20" rx="2" fill="#0c2340" fillOpacity="0.15" />
      <rect x="58" y="54" width="14" height="12" rx="2" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.45" strokeWidth="1.5" />
      <line x1="65" y1="54" x2="65" y2="66" stroke="#e86a17" strokeWidth="2" opacity="0.8" />
      <circle cx="76" cy="44" r="8" fill="#147a54" />
      <path d="M72.5 44l2.5 2.5 5-5" stroke="#ffffff" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Courier scooter — common last-mile Indian delivery vehicle. */
export function CourierScooter({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden="true">
      <ellipse cx="60" cy="64" rx="48" ry="3" fill="#0c2340" opacity="0.08" />
      <circle cx="28" cy="52" r="10" fill="#0c2340" />
      <circle cx="28" cy="52" r="4" fill="#f4f6f9" />
      <circle cx="88" cy="52" r="10" fill="#0c2340" />
      <circle cx="88" cy="52" r="4" fill="#f4f6f9" />
      <path d="M34 46h36c2 0 4 1.5 5 3.5l6 12H40l-6-15.5z" fill="#e86a17" />
      <path d="M70 28h18l8 18H70z" fill="#0c2340" />
      <rect x="74" y="14" width="22" height="16" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.5" />
      <line x1="85" y1="14" x2="85" y2="30" stroke="#e86a17" strokeWidth="2" opacity="0.8" />
      <path d="M48 34c0-8 6-14 14-14" fill="none" stroke="#0c2340" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* Auto-rickshaw — tasteful Indian transport detail. */
export function AutoRickshaw({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 110 70" className={className} aria-hidden="true">
      <ellipse cx="55" cy="64" rx="42" ry="3" fill="#0c2340" opacity="0.08" />
      <path d="M18 40h52l8-16h14l6 16v14H18z" fill="#e86a17" />
      <path d="M70 26h12l4 12H70z" fill="#eaf1f8" />
      <rect x="24" y="44" width="28" height="10" rx="2" fill="#0c2340" opacity="0.2" />
      <circle cx="30" cy="56" r="8" fill="#0c2340" />
      <circle cx="30" cy="56" r="3.2" fill="#f4f6f9" />
      <circle cx="82" cy="56" r="8" fill="#0c2340" />
      <circle cx="82" cy="56" r="3.2" fill="#f4f6f9" />
      <path d="M18 40c-4 0-8 4-8 8v8h8z" fill="#0c2340" />
    </svg>
  );
}

/* Cargo ship silhouette for ocean freight vibe. */
export function CargoShip({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 70" className={className} aria-hidden="true">
      <path d="M8 48h144l-10 14H18z" fill="#0c2340" />
      <rect x="30" y="28" width="18" height="20" rx="2" fill="#e86a17" opacity="0.85" />
      <rect x="52" y="22" width="18" height="26" rx="2" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" />
      <rect x="74" y="26" width="18" height="22" rx="2" fill="#e86a17" opacity="0.65" />
      <rect x="96" y="18" width="22" height="30" rx="2" fill="#0c2340" opacity="0.45" />
      <rect x="122" y="30" width="14" height="18" rx="2" fill="#147a54" opacity="0.7" />
      <path d="M0 62c20-6 40-6 60 0s40 6 60 0 28-4 40 0" fill="none" stroke="#0c2340" strokeOpacity="0.2" strokeWidth="2" />
    </svg>
  );
}

/* Weight scale for shipping calculator. */
export function WeightScale({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 70" className={className} aria-hidden="true">
      <rect x="34" y="18" width="12" height="36" rx="2" fill="#0c2340" opacity="0.35" />
      <ellipse cx="40" cy="54" rx="22" ry="5" fill="#0c2340" opacity="0.12" />
      <rect x="18" y="12" width="44" height="10" rx="3" fill="#0c2340" />
      <rect x="26" y="28" width="28" height="20" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="1.5" />
      <line x1="40" y1="28" x2="40" y2="48" stroke="#e86a17" strokeWidth="2.5" opacity="0.8" />
      <text x="40" y="10" textAnchor="middle" fill="#e86a17" fontSize="8" fontWeight="700">kg</text>
    </svg>
  );
}

/* Product category chips as small parcel icons (clothing, books, jewellery, gifts, textiles). */
export function ProductParcels({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 220 90" className={className} aria-hidden="true">
      {/* clothing */}
      <g>
        <rect x="8" y="28" width="36" height="36" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="26" y1="28" x2="26" y2="64" stroke="#e86a17" strokeWidth="2.5" opacity="0.75" />
        <path d="M18 42h16l-2 12H20z" fill="#e86a17" opacity="0.35" />
        <path d="M20 40c2-4 6-4 8 0" fill="none" stroke="#0c2340" strokeOpacity="0.45" strokeWidth="1.25" />
      </g>
      {/* books */}
      <g>
        <rect x="52" y="20" width="36" height="36" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="70" y1="20" x2="70" y2="56" stroke="#147a54" strokeWidth="2.5" opacity="0.7" />
        <rect x="60" y="32" width="20" height="14" rx="1.5" fill="#147a54" opacity="0.35" />
        <line x1="64" y1="36" x2="76" y2="36" stroke="#0c2340" strokeOpacity="0.35" />
        <line x1="64" y1="40" x2="74" y2="40" stroke="#0c2340" strokeOpacity="0.25" />
      </g>
      {/* jewellery */}
      <g>
        <rect x="96" y="32" width="36" height="36" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="114" y1="32" x2="114" y2="68" stroke="#d4a017" strokeWidth="2.5" opacity="0.8" />
        <circle cx="114" cy="50" r="7" fill="none" stroke="#d4a017" strokeWidth="1.75" />
        <circle cx="114" cy="50" r="2.5" fill="#d4a017" opacity="0.7" />
      </g>
      {/* gift */}
      <g>
        <rect x="140" y="18" width="36" height="36" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="158" y1="18" x2="158" y2="54" stroke="#e86a17" strokeWidth="2.5" opacity="0.8" />
        <rect x="148" y="30" width="20" height="16" rx="2" fill="#e86a17" opacity="0.25" />
        <line x1="158" y1="30" x2="158" y2="46" stroke="#e86a17" strokeWidth="1.75" />
        <line x1="148" y1="38" x2="168" y2="38" stroke="#e86a17" strokeWidth="1.75" />
      </g>
      {/* textile roll */}
      <g>
        <rect x="184" y="28" width="36" height="36" rx="4" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="202" y1="28" x2="202" y2="64" stroke="#0c2340" strokeWidth="2.5" opacity="0.45" />
        <ellipse cx="202" cy="46" rx="10" ry="6" fill="none" stroke="#0c2340" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M192 46c2 4 8 6 12 4" fill="none" stroke="#e86a17" strokeWidth="1.5" opacity="0.7" />
      </g>
    </svg>
  );
}

/* Elegant crescent motif (Eid — geometric, respectful). */
export function CrescentMotif({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M24 6a14 14 0 100 28 11 11 0 110-28z"
        fill="currentColor"
        fillOpacity="0.55"
      />
      <circle cx="30" cy="12" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* Conveyor belt with parcels. */
export function ConveyorBelt({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 70" className={className} aria-hidden="true">
      <rect x="8" y="40" width="184" height="14" rx="7" fill="#0c2340" opacity="0.15" />
      <g className="road-line" stroke="#0c2340" strokeOpacity="0.35" strokeWidth="2">
        <line x1="20" y1="47" x2="180" y2="47" strokeDasharray="8 10" />
      </g>
      <rect x="36" y="18" width="22" height="20" rx="3" fill="#e86a17" opacity="0.85" />
      <rect x="78" y="14" width="26" height="24" rx="3" fill="#ffffff" stroke="#0c2340" strokeOpacity="0.35" />
      <line x1="91" y1="14" x2="91" y2="38" stroke="#e86a17" strokeWidth="2.5" opacity="0.75" />
      <rect x="128" y="20" width="20" height="18" rx="3" fill="#0c2340" opacity="0.45" />
      <rect x="162" y="16" width="24" height="22" rx="3" fill="#147a54" opacity="0.65" />
    </svg>
  );
}

/* Tracking timeline icons row (decorative). */
export function TrackingTimelineVisual({ className = "" }: IllustrationProps) {
  const nodes = [
    { label: "Received", x: 20 },
    { label: "Inspect", x: 70 },
    { label: "Packed", x: 120 },
    { label: "Shipped", x: 170 },
    { label: "Delivered", x: 220 },
  ];
  return (
    <svg viewBox="0 0 240 56" className={className} aria-hidden="true">
      <line x1="20" y1="18" x2="220" y2="18" stroke="#0c2340" strokeOpacity="0.2" strokeWidth="2" />
      <line x1="20" y1="18" x2="140" y2="18" stroke="#e86a17" strokeWidth="2.5" className="route-line" />
      {nodes.map((n, i) => (
        <g key={n.label}>
          <circle
            cx={n.x}
            cy="18"
            r="7"
            fill={i <= 2 ? "#e86a17" : "#ffffff"}
            stroke={i <= 2 ? "#e86a17" : "#0c2340"}
            strokeOpacity={i <= 2 ? 1 : 0.3}
            strokeWidth="1.5"
          />
          {i <= 2 ? (
            <circle cx={n.x} cy="18" r="2.5" fill="#ffffff" />
          ) : null}
          <text
            x={n.x}
            y="42"
            textAnchor="middle"
            fill="#3a4f6a"
            fontSize="7"
            fontWeight="600"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* Layered hero scene: warehouse + truck + globe routes. */
export function HeroLogisticsScene({ className = "" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 520 420"
      className={className}
      role="img"
      aria-label="IndiRoute warehouse in India sending parcels worldwide"
    >
      {/* soft grid */}
      <g stroke="#ffffff" strokeOpacity="0.05">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`v${i}`} x1={52 * (i + 1)} y1="0" x2={52 * (i + 1)} y2="420" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={52 * (i + 1)} x2="520" y2={52 * (i + 1)} />
        ))}
      </g>

      {/* India map silhouette */}
      <path
        d="M210 170l18-10 12 12 12 5-5 16 10 10 22-5 16-12 10 12-12 16-12 10 5 12-16 10-10 22-12 24-10 30-8 24-10-22-8-22-14-16-14-12-16-10 10-16 12-10 5-20 8-16z"
        fill="#ffffff"
        fillOpacity="0.06"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />

      {/* warehouse building */}
      <g transform="translate(40 210)">
        <path d="M10 40L90 8l80 32" fill="none" stroke="#e86a17" strokeWidth="5" strokeLinecap="round" />
        <rect x="20" y="40" width="140" height="70" rx="4" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeOpacity="0.35" />
        <rect x="68" y="58" width="44" height="52" rx="3" fill="#0c2340" fillOpacity="0.35" stroke="#ffffff" strokeOpacity="0.25" />
        <rect x="60" y="44" width="60" height="12" rx="3" fill="#e86a17" />
        <text x="90" y="53" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="700">
          IndiRoute
        </text>
        <rect x="30" y="72" width="14" height="12" rx="2" fill="#e86a17" opacity="0.85" />
        <rect x="48" y="74" width="12" height="10" rx="2" fill="#ffffff" opacity="0.55" />
        <rect x="126" y="72" width="14" height="12" rx="2" fill="#ffffff" opacity="0.55" />
        <rect x="144" y="74" width="12" height="10" rx="2" fill="#e86a17" opacity="0.7" />
      </g>

      {/* globe */}
      <g transform="translate(300 40)">
        <circle cx="90" cy="90" r="70" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" />
        <ellipse cx="90" cy="90" rx="28" ry="70" fill="none" stroke="#ffffff" strokeOpacity="0.15" />
        <path d="M20 90h140M90 20a100 100 0 010 140M90 20a100 100 0 000 140" fill="none" stroke="#ffffff" strokeOpacity="0.12" />
      </g>

      {/* routes */}
      <g fill="none" strokeLinecap="round" strokeWidth="2">
        <path d="M180 280 C 220 180, 300 120, 380 90" stroke="#e86a17" strokeOpacity="0.85" className="route-line" />
        <path d="M180 280 C 260 220, 360 200, 460 160" stroke="#ffffff" strokeOpacity="0.45" className="route-line" style={{ animationDelay: "-0.6s" }} />
        <path d="M180 280 C 240 300, 340 280, 470 240" stroke="#e86a17" strokeOpacity="0.5" className="route-line" style={{ animationDelay: "-1.2s" }} />
      </g>

      {/* moving plane + parcel */}
      <g className="motion-only">
        <g>
          <path d="M-10 0L10 -4 4 0 10 4z" fill="#ffffff" />
          <animateMotion dur="8s" repeatCount="indefinite" rotate="auto" path="M180 280 C 220 180, 300 120, 380 90" />
        </g>
        <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#e86a17">
          <animateMotion dur="10s" repeatCount="indefinite" path="M180 280 C 260 220, 360 200, 460 160" />
        </rect>
      </g>

      {/* destination pins */}
      <g fill="#e86a17">
        <circle cx="380" cy="90" r="5" className="route-node" />
        <circle cx="460" cy="160" r="4" opacity="0.85" className="route-node" style={{ animationDelay: "-0.8s" }} />
        <circle cx="470" cy="240" r="4" opacity="0.7" className="route-node" style={{ animationDelay: "-1.4s" }} />
      </g>
      <text x="380" y="78" textAnchor="middle" fill="#ffffff" fillOpacity="0.75" fontSize="9" fontWeight="600">AU</text>
      <text x="470" y="152" textAnchor="middle" fill="#ffffff" fillOpacity="0.75" fontSize="9" fontWeight="600">UK</text>
      <text x="480" y="236" textAnchor="middle" fill="#ffffff" fillOpacity="0.75" fontSize="9" fontWeight="600">US</text>

      {/* truck */}
      <g className="animate-truck" transform="translate(200 320)">
        <rect x="0" y="8" width="70" height="28" rx="4" fill="#0c2340" />
        <rect x="0" y="8" width="70" height="6" rx="3" fill="#e86a17" />
        <text x="35" y="28" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="700">IndiRoute</text>
        <path d="M70 14h18l8 12v10H70z" fill="#e86a17" />
        <circle cx="18" cy="42" r="7" fill="#0c2340" />
        <circle cx="18" cy="42" r="3" fill="#f4f6f9" />
        <circle cx="78" cy="42" r="7" fill="#0c2340" />
        <circle cx="78" cy="42" r="3" fill="#f4f6f9" />
      </g>

      <text x="120" y="400" textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="10" letterSpacing="2" fontWeight="600">
        INDIA → WORLD
      </text>
    </svg>
  );
}
