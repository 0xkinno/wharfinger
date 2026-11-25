// Hand-built hero art. viewBox 1200x900, three layers: dawn sky and grid, a bulk carrier at a berth with loaders, and a
// floating time sheet with two stapled receipt tags. A cyan line carries one pulse every 6 seconds from the quay mast.
export function HarbourScene() {
  return (
    <svg data-art viewBox="0 0 1200 900" role="img" aria-label="A bulk carrier at a Kotka berth at dawn, and a time sheet with two receipt tags stapled to it" className="w-full h-auto rounded-[28px]">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1B33" /><stop offset=".55" stopColor="#5B7391" /><stop offset="1" stopColor="#F3F1EC" /></linearGradient>
        <radialGradient id="sun" cx=".72" cy=".62" r=".35"><stop offset="0" stopColor="#E8FBFF" stopOpacity=".95" /><stop offset=".4" stopColor="#19D3FF" stopOpacity=".28" /><stop offset="1" stopColor="#19D3FF" stopOpacity="0" /></radialGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7E97B3" stopOpacity=".9" /><stop offset="1" stopColor="#0B1B33" stopOpacity=".85" /></linearGradient>
        <filter id="soft"><feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#0B1B33" floodOpacity=".28" /></filter>
      </defs>
      <rect width="1200" height="900" fill="url(#sky)" /><rect width="1200" height="900" fill="url(#sun)" />
      <g stroke="#fff" strokeOpacity=".12" strokeWidth="1">{[...Array(12)].map((_, i) => <line key={`v${i}`} x1={100 * i + 50} y1="0" x2={100 * i + 50} y2="560" />)}{[...Array(6)].map((_, i) => <line key={`h${i}`} x1="0" y1={90 * i + 40} x2="1200" y2={90 * i + 40} />)}</g>
      <rect y="560" width="1200" height="340" fill="url(#water)" />
      <g className="drift" opacity=".5" stroke="#E8FBFF" strokeWidth="2" strokeLinecap="round">{[...Array(9)].map((_, i) => <path key={i} d={`M${40 + i * 150} ${600 + (i % 3) * 38} q40 -9 80 0 t80 0`} fill="none" />)}</g>
      {/* quay */}
      <polygon points="0,540 520,540 560,575 0,575" fill="#1d3150" /><rect y="575" width="560" height="22" fill="#0e2038" />
      <g fill="#C29A45">{[60, 160, 260, 360, 460].map((x) => <rect key={x} x={x} y="528" width="12" height="14" rx="3" />)}</g>
      {/* mast */}
      <rect x="120" y="360" width="8" height="180" fill="#0B1B33" /><circle cx="124" cy="356" r="9" fill="#19D3FF" />
      {/* shore loaders */}
      <g stroke="#0B1B33" strokeWidth="6" fill="none" strokeLinecap="round"><path d="M250 540 V420 L360 380" /><path d="M420 540 V430 L520 392" /></g>
      {/* carrier */}
      <g filter="url(#soft)"><polygon points="360,560 1010,560 1070,505 395,505" fill="#0B1B33" /><rect x="395" y="470" width="640" height="38" fill="#14294a" />
        <rect x="900" y="400" width="90" height="72" fill="#F3F1EC" /><rect x="915" y="415" width="60" height="14" fill="#19D3FF" opacity=".7" /><rect x="925" y="350" width="40" height="52" fill="#E6E2D8" />
        {[440, 520, 600, 680, 760].map((x) => <rect key={x} x={x} y="448" width="60" height="22" rx="3" fill="#C29A45" opacity=".85" />)}
        <g stroke="#E6E2D8" strokeWidth="4" fill="none"><path d="M560 448 V380 L640 360" /><path d="M720 448 V380 L800 360" /></g></g>
      {/* the wire */}
      <path className="wirepulse" d="M124 356 C 300 250, 700 260, 930 640" fill="none" stroke="#19D3FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M124 356 C 300 250, 700 260, 930 640" fill="none" stroke="#19D3FF" strokeWidth="1" opacity=".35" />
      {/* time sheet */}
      <g className="floaty"><g transform="translate(700 600) rotate(-4)" filter="url(#soft)">
        <rect width="420" height="250" rx="10" fill="#fff" stroke="#E6E2D8" />
        <text x="22" y="38" fontFamily="IBM Plex Mono, monospace" fontSize="13" fill="#5B6B82" letterSpacing="2">LAYTIME STATEMENT</text>
        {[["NOR  02:40", "valid at tender"], ["14:00 to 18:00", "excepted, 1 receipt"], ["demurrage", "41 h  $30,750"]].map(([a, b], i) => <g key={i}><line x1="22" x2="398" y1={70 + i * 46} y2={70 + i * 46} stroke="#E6E2D8" /><text x="22" y={98 + i * 46} fontFamily="IBM Plex Mono, monospace" fontSize="17" fill="#0B1B33">{a}</text><text x="398" y={98 + i * 46} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#5B6B82">{b}</text></g>)}
        <g transform="translate(250 190)"><rect width="150" height="46" rx="6" fill="#F3F1EC" stroke="#C29A45" /><rect x="-4" y="-6" width="26" height="9" rx="2" fill="#C29A45" /><text x="10" y="21" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#0B1B33">0x9f2c...b14a</text><text x="10" y="37" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#8a6a1f">PAID 0.01</text></g>
        <g transform="translate(86 196)"><rect width="150" height="46" rx="6" fill="#F3F1EC" stroke="#C29A45" /><rect x="-4" y="-6" width="26" height="9" rx="2" fill="#C29A45" /><text x="10" y="21" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#0B1B33">0x41de...77c0</text><text x="10" y="37" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#8a6a1f">PAID 0.01</text></g>
      </g></g>
    </svg>
  );
}
export function Mark({ size = 28 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0B1B33" /><path d="M10 12 L15 29 L20 18 L25 29 L30 12" fill="none" stroke="#19D3FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="20" cy="9" r="2.4" fill="#C29A45" /></svg>);
}
