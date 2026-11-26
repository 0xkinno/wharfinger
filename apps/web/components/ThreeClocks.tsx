// The idea that makes a paid answer a fact: three independent clocks on one purchase.
export function ThreeClocks() {
  return (
    <svg viewBox="0 0 1000 300" role="img" aria-label="Three clocks on one purchase: the two-minute authorization window, the signal time recorded by the node, and the epoch that bills it" className="w-full h-auto">
      <defs><linearGradient id="tc" x1="0" x2="1"><stop offset="0" stopColor="#19D3FF" stopOpacity=".05" /><stop offset="1" stopColor="#19D3FF" stopOpacity=".22" /></linearGradient></defs>
      <line x1="30" y1="210" x2="970" y2="210" stroke="#0B1B33" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={30 + i * 134} y1="204" x2={30 + i * 134} y2="216" stroke="#5B6B82" />)}
      <rect x="250" y="70" width="190" height="130" rx="14" fill="url(#tc)" stroke="#19D3FF" />
      <text x="262" y="96" fontFamily="IBM Plex Mono, monospace" fontSize="13" fill="#0B1B33" letterSpacing="1.5">1  AUTHORIZATION WINDOW</text>
      <text x="262" y="122" fontFamily="Instrument Sans Variable, sans-serif" fontSize="15" fill="#5B6B82">at most 2 minutes, nonce works once</text>
      <text x="262" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="14" fill="#0B1B33">signed by the voyage key</text>
      <circle cx="372" cy="210" r="9" fill="#C29A45" stroke="#fff" strokeWidth="3" />
      <line x1="372" y1="150" x2="372" y2="201" stroke="#C29A45" strokeDasharray="4 4" />
      <text x="372" y="244" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="13" fill="#0B1B33">2  SIGNAL RECORDED</text>
      <text x="372" y="264" textAnchor="middle" fontFamily="Instrument Sans Variable, sans-serif" fontSize="14" fill="#5B6B82">node stamps created_at inside the window</text>
      <rect x="520" y="70" width="440" height="130" rx="14" fill="#fff" stroke="#0B1B33" strokeDasharray="6 5" />
      <text x="534" y="96" fontFamily="IBM Plex Mono, monospace" fontSize="13" fill="#0B1B33" letterSpacing="1.5">3  EPOCH THAT BILLS IT</text>
      <text x="534" y="122" fontFamily="Instrument Sans Variable, sans-serif" fontSize="15" fill="#5B6B82">the receipt names the epoch; its block lists the payment</text>
      <text x="534" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="14" fill="#0B1B33">provable once the epoch closes</text>
      <text x="30" y="40" fontFamily="Fraunces Variable, serif" fontSize="26" fill="#0B1B33">One purchase, three clocks nobody on our side controls.</text>
    </svg>
  );
}
