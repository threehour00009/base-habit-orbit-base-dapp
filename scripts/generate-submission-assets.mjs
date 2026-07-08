import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function wrapLines(lines, maxChars) {
  return lines.flatMap((line) => wrap(line, maxChars));
}

function frame(content, bg = "#08101c") {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#050a12"/>
      </linearGradient>
      <radialGradient id="halo" cx="0.2" cy="0.08" r="0.92">
        <stop offset="0%" stop-color="#4d76b8" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#4d76b8" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#halo)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 34);
  return `
    <text x="72" y="104" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#7db6ff">BASE HABIT ORBIT</text>
    <text x="72" y="220" font-family="Arial, sans-serif" font-size="88" font-weight="900" fill="#edf4ff">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="76" y="${296 + index * 42}" font-family="Arial, sans-serif" font-size="33" font-weight="700" fill="#93a9c7">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, stroke = "#7db6ff", fg = "#edf4ff") {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 70}" height="56" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <text x="${x + 28}" y="${y + 37}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function panel(x, y, width, height, title, lines, bg = "#0b1626", accent = "#7db6ff") {
  const wrapped = wrapLines(lines, Math.max(18, Math.floor((width - 48) / 12)));
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="${bg}" stroke="#7db6ff" stroke-opacity="0.16" stroke-width="4"/>
      <circle cx="${x + 42}" cy="${y + 42}" r="10" fill="${accent}"/>
      <text x="${x + 68}" y="${y + 50}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#7db6ff">${esc(title)}</text>
      ${wrapped.map((line, index) => `<text x="${x + 24}" y="${y + 112 + index * 34}" font-family="Arial, sans-serif" font-size="${index === 0 ? 34 : 28}" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? "#edf4ff" : "#93a9c7"}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function orbit(x, y, count, label) {
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="176" fill="#0b1626" stroke="#27486f" stroke-width="18"/>
      <circle cx="${x}" cy="${y}" r="128" fill="none" stroke="#7db6ff" stroke-width="16"/>
      <circle cx="${x}" cy="${y}" r="82" fill="none" stroke="#ffc56c" stroke-width="12"/>
      <circle cx="${x - 126}" cy="${y}" r="12" fill="#7db6ff"/>
      <circle cx="${x + 126}" cy="${y}" r="12" fill="#ffc56c"/>
      <text x="${x}" y="${y - 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#7db6ff">${esc(label)}</text>
      <text x="${x}" y="${y + 42}" text-anchor="middle" font-family="Arial, sans-serif" font-size="98" font-weight="900" fill="#edf4ff">${count}</text>
      <text x="${x}" y="${y + 88}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#93a9c7">completions</text>
    </g>`;
}

function button(x, y, width, text, fill, fg = "#08101c") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="96" rx="48" fill="${fill}" stroke="#7db6ff" stroke-opacity="0.16" stroke-width="4"/>
    <text x="${x + width / 2}" y="${y + 61}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function screenshot1() {
  const content = `
    ${header("Keep one habit in orbit.", "Pick a habit, write one short completion note, and stamp the record on Base.")}
    ${pill(72, 392, "Read orbit", "#0f2034")}
    ${pill(252, 392, "Count visible", "#10263f")}
    ${orbit(286, 826, 4, "Habit orbit")}
    ${panel(560, 540, 652, 300, "Primary action", ["Read", "Count: 4", "Note: Completed a quiet session and kept the chain alive."], "#0b1626", "#7db6ff")}
    ${panel(72, 1168, 548, 236, "Why it works", ["One habit", "One visible orbit"], "#0a1321", "#ffc56c")}
    ${panel(664, 1168, 548, 236, "Orbit rules", ["Simple log", "Running count", "Lookup by ID"], "#0a1321", "#7db6ff")}
    ${button(72, 2522, 1140, "Log orbit on Base", "#7db6ff")}
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("The orbit grows.", "Every completion increments the running count and keeps the habit visible as a small public streak.")}
    ${pill(72, 392, "Confirmed", "#10263f")}
    ${pill(232, 392, "Latest orbit", "#0f2034")}
    ${panel(72, 540, 1140, 292, "Latest orbit", ["Read", "Completed a quiet session and kept the chain alive.", "Author: 0x9936...9652"], "#0b1626", "#7db6ff")}
    ${orbit(294, 1212, 4, "Read")}
    ${panel(566, 996, 646, 256, "Orbit state", ["Count: 4", "Stored on Base"], "#0a1321", "#ffc56c")}
    ${panel(566, 1292, 646, 206, "Board note", ["Small daily wins stay visible when the count is easy to scan."], "#0a1321", "#7db6ff")}
    ${button(72, 2522, 1140, "View latest orbit", "#ffc56c", "#08101c")}
  `;
  return frame(content, "#09111e");
}

function screenshot3() {
  const content = `
    ${header("Look up any orbit.", "Pull one habit completion by ID and see the habit, note, count, author, and date.")}
    ${pill(72, 392, "Orbit #8", "#0f2034")}
    ${pill(236, 392, "Lookup mode", "#10263f")}
    ${panel(72, 540, 1140, 286, "Lookup result", ["Read", "Count: 4", "May 14, 2026"], "#0b1626", "#7db6ff")}
    ${panel(72, 870, 1140, 286, "Completion note", ["Completed a quiet session and kept the chain alive."], "#0a1321", "#ffc56c")}
    ${panel(72, 1202, 548, 236, "Author", ["0x9936...9652", "Public orbit log"], "#0a1321", "#7db6ff")}
    ${panel(664, 1202, 548, 236, "State", ["Orbit found", "Board ready"], "#0a1321", "#ffc56c")}
    ${button(72, 2522, 1140, "Log another orbit", "#7db6ff")}
  `;
  return frame(content, "#08101c");
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#08101c"/>
    <circle cx="512" cy="512" r="340" fill="#0b1626" stroke="#27486f" stroke-width="26"/>
    <circle cx="512" cy="512" r="238" fill="none" stroke="#7db6ff" stroke-width="22"/>
    <circle cx="512" cy="512" r="152" fill="none" stroke="#ffc56c" stroke-width="18"/>
    <circle cx="374" cy="512" r="26" fill="#7db6ff"/>
    <circle cx="650" cy="512" r="26" fill="#ffc56c"/>
    <circle cx="512" cy="512" r="66" fill="#edf4ff"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#08101c"/>
        <stop offset="100%" stop-color="#050a12"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="url(#bg)"/>
    <circle cx="300" cy="180" r="260" fill="#4d76b8" opacity="0.22"/>
    <text x="96" y="198" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#edf4ff">Base Habit Orbit</text>
    <text x="100" y="292" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#93a9c7">A cosmic-style board for daily habits, running counts, and clean onchain completion logs.</text>
    ${pill(100, 348, "Read habit", "#0f2034")}
    ${pill(330, 348, "Running count", "#10263f")}
    ${button(100, 448, 430, "Log orbit", "#7db6ff")}
    ${button(560, 448, 430, "Lookup orbit", "#ffc56c", "#08101c")}
    ${orbit(1450, 300, 4, "Read")}
    ${panel(1110, 622, 700, 220, "Latest orbit", ["Read", "Count: 4", "Ready to look up by ID"], "#0b1626", "#7db6ff")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

for (const file of files) {
  console.log(file);
}
