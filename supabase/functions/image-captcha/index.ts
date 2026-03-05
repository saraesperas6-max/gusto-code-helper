import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SvgGenerator = (bg: string, color: string) => string;

const categories: Record<string, SvgGenerator> = {
  'traffic lights': (bg, _color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <rect width="150" height="150" fill="${bg}"/>
  <rect x="55" y="10" width="40" height="110" rx="8" fill="#333"/>
  <rect x="70" y="120" x2="80" width="10" height="20" fill="#555"/>
  <circle cx="75" cy="35" r="13" fill="#e74c3c"/>
  <circle cx="75" cy="65" r="13" fill="#f39c12"/>
  <circle cx="75" cy="95" r="13" fill="#2ecc71"/>
</svg>`,
  'cars': (bg, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <rect width="150" height="150" fill="${bg}"/>
  <rect x="15" y="72" width="120" height="35" rx="6" fill="${color}"/>
  <path d="M40 72 L50 42 L100 42 L110 72" fill="${color}" opacity="0.9"/>
  <rect x="52" y="48" width="20" height="18" rx="2" fill="#ADE" opacity="0.8"/>
  <rect x="78" y="48" width="20" height="18" rx="2" fill="#ADE" opacity="0.8"/>
  <circle cx="42" cy="112" r="13" fill="#333"/><circle cx="42" cy="112" r="6" fill="#999"/>
  <circle cx="108" cy="112" r="13" fill="#333"/><circle cx="108" cy="112" r="6" fill="#999"/>
  <rect x="120" y="78" width="12" height="8" rx="2" fill="#e74c3c" opacity="0.8"/>
  <rect x="18" y="78" width="12" height="8" rx="2" fill="#f1c40f" opacity="0.8"/>
</svg>`,
  'buses': (bg, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <rect width="150" height="150" fill="${bg}"/>
  <rect x="12" y="35" width="126" height="75" rx="6" fill="${color}"/>
  <rect x="12" y="35" width="126" height="22" rx="6" fill="${color}" opacity="0.8"/>
  <rect x="20" y="42" width="24" height="18" rx="2" fill="#ADE"/>
  <rect x="50" y="42" width="24" height="18" rx="2" fill="#ADE"/>
  <rect x="80" y="42" width="24" height="18" rx="2" fill="#ADE"/>
  <rect x="110" y="42" width="20" height="18" rx="2" fill="#ADE"/>
  <rect x="12" y="97" width="126" height="6" fill="#555"/>
  <circle cx="38" cy="115" r="11" fill="#333"/><circle cx="38" cy="115" r="5" fill="#999"/>
  <circle cx="112" cy="115" r="11" fill="#333"/><circle cx="112" cy="115" r="5" fill="#999"/>
</svg>`,
  'bicycles': (bg, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <rect width="150" height="150" fill="${bg}"/>
  <circle cx="40" cy="95" r="24" fill="none" stroke="${color}" stroke-width="4"/>
  <circle cx="110" cy="95" r="24" fill="none" stroke="${color}" stroke-width="4"/>
  <line x1="40" y1="95" x2="70" y2="55" stroke="${color}" stroke-width="3"/>
  <line x1="70" y1="55" x2="110" y2="95" stroke="${color}" stroke-width="3"/>
  <line x1="70" y1="55" x2="85" y2="55" stroke="${color}" stroke-width="3"/>
  <line x1="85" y1="55" x2="110" y2="95" stroke="${color}" stroke-width="2"/>
  <line x1="70" y1="55" x2="65" y2="42" stroke="${color}" stroke-width="3"/>
  <line x1="60" y1="42" x2="72" y2="42" stroke="${color}" stroke-width="3"/>
  <circle cx="40" cy="95" r="4" fill="${color}"/>
  <circle cx="110" cy="95" r="4" fill="${color}"/>
</svg>`,
  'houses': (bg, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <rect width="150" height="150" fill="${bg}"/>
  <rect x="30" y="70" width="90" height="65" fill="${color}"/>
  <polygon points="75,20 20,70 130,70" fill="#8B4513"/>
  <rect x="60" y="98" width="30" height="37" fill="#654321"/>
  <circle cx="84" cy="118" r="2" fill="#DAA520"/>
  <rect x="38" y="80" width="18" height="16" fill="#87CEEB"/>
  <rect x="94" y="80" width="18" height="16" fill="#87CEEB"/>
  <line x1="47" y1="80" x2="47" y2="96" stroke="#666" stroke-width="1"/>
  <line x1="38" y1="88" x2="56" y2="88" stroke="#666" stroke-width="1"/>
  <line x1="103" y1="80" x2="103" y2="96" stroke="#666" stroke-width="1"/>
  <line x1="94" y1="88" x2="112" y2="88" stroke="#666" stroke-width="1"/>
</svg>`,
  'trees': (bg, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <rect width="150" height="150" fill="${bg}"/>
  <rect x="67" y="100" width="16" height="38" fill="#8B4513"/>
  <polygon points="75,15 25,100 125,100" fill="${color}"/>
  <polygon points="75,35 35,90 115,90" fill="${color}" opacity="0.8"/>
</svg>`,
};

const bgColors = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#F3E5F5', '#E0F2F1', '#FBE9E7', '#F1F8E9', '#E8EAF6', '#FFFDE7', '#FCE4EC'];
const colorPools: Record<string, string[]> = {
  'traffic lights': ['#333'],
  'cars': ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#c0392b', '#2980b9'],
  'buses': ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#FF6B35', '#1abc9c'],
  'bicycles': ['#333', '#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#8e44ad', '#c0392b'],
  'houses': ['#ecf0f1', '#f5deb3', '#deb887', '#d2b48c', '#faebd7', '#ffe4c4', '#f5f5dc'],
  'trees': ['#27ae60', '#2ecc71', '#1abc9c', '#16a085', '#229954', '#0e6655', '#148f77'],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSvg(category: string): string {
  const bg = randomItem(bgColors);
  const color = randomItem(colorPools[category] || ['#333']);
  const gen = categories[category];
  const svg = gen(bg, color);
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const secret = Deno.env.get('CAPTCHA_HMAC_SECRET');
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'GET') {
    const categoryNames = Object.keys(categories);
    const targetCategory = randomItem(categoryNames);
    const gridSize = 9;
    const targetCount = 3 + Math.floor(Math.random() * 2); // 3-4 targets

    const distractorCategories = categoryNames.filter(c => c !== targetCategory);
    const cells: { image: string; isTarget: boolean }[] = [];

    for (let i = 0; i < targetCount; i++) {
      cells.push({ image: generateSvg(targetCategory), isTarget: true });
    }
    for (let i = 0; i < gridSize - targetCount; i++) {
      cells.push({ image: generateSvg(randomItem(distractorCategories)), isTarget: false });
    }

    // Shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const correctIndices = cells.map((c, i) => c.isTarget ? i : -1).filter(i => i !== -1);
    const challengeId = crypto.randomUUID();
    const challengeData = JSON.stringify({ id: challengeId, correct: correctIndices, exp: Date.now() + 180000 });
    const signature = await hmacSign(challengeData, secret);

    return new Response(JSON.stringify({
      challengeId,
      target: targetCategory,
      images: cells.map(c => c.image),
      token: btoa(challengeData) + '.' + signature,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const { token, selected } = await req.json();
    const dotIdx = token.lastIndexOf('.');
    const dataB64 = token.substring(0, dotIdx);
    const signature = token.substring(dotIdx + 1);
    const challengeData = atob(dataB64);

    const expectedSig = await hmacSign(challengeData, secret);
    if (expectedSig !== signature) {
      return new Response(JSON.stringify({ verified: false, error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { correct, exp } = JSON.parse(challengeData);
    if (Date.now() > exp) {
      return new Response(JSON.stringify({ verified: false, error: 'Challenge expired' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const selectedSorted = [...(selected || [])].sort((a: number, b: number) => a - b);
    const correctSorted = [...correct].sort((a: number, b: number) => a - b);
    const isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctSorted);

    return new Response(JSON.stringify({ verified: isCorrect }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
