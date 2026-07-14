function formatExportEntry(e, t) {
  const lines = [];
  if (e?.happy) lines.push(`${t.tagHappy}: ${e.happy}`);
  if (e?.mind) lines.push(`${t.tagMind}: ${e.mind}`);
  if (e?.next) lines.push(`${t.tagNext}: ${e.next}`);
  return lines.join("\n");
}

export function buildExportText(data, t, partnerName) {
  let out = `Futari — ${t.journalTitle}\n`;
  const personalDates = Object.keys(data.personal.entries).sort();
  if (personalDates.length) {
    out += `\n## ${t.modePersonal}\n`;
    for (const d of personalDates) {
      const body = formatExportEntry(data.personal.entries[d], t);
      if (body) out += `\n${d}\n${body}\n`;
    }
  }
  if (data.pair) {
    const pairDates = Object.keys(data.pair.entries).sort();
    if (pairDates.length) {
      out += `\n## ${t.modePair}\n`;
      for (const d of pairDates) {
        const e = data.pair.entries[d];
        const mine = formatExportEntry(e.me, t);
        const theirs = formatExportEntry(e.partner, t);
        if (!mine && !theirs) continue;
        out += `\n${d}\n`;
        if (mine) out += `${t.you}:\n${mine}\n`;
        if (theirs) out += `${partnerName}:\n${theirs}\n`;
      }
    }
  }
  return out;
}
