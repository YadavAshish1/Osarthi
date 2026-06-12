/** Split a plain string on newlines and return fragments with <br> between each line */
function splitLines(text, keyPrefix) {
  return text.split('\n').flatMap((line, i, arr) => {
    const el = <span key={`${keyPrefix}-l${i}`}>{line}</span>;
    return i < arr.length - 1 ? [el, <br key={`${keyPrefix}-br${i}`} />] : [el];
  });
}

export function renderMarkedText(text = '', marks = []) {
  // No marks — just split on newlines and return with <br>
  if (!marks?.length) {
    return splitLines(text, 'plain');
  }

  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  sorted.forEach((mark, i) => {
    if (mark.start > cursor) {
      segments.push({ text: text.slice(cursor, mark.start), mark: null, key: `t-${i}` });
    }
    segments.push({
      text: text.slice(mark.start, mark.end),
      mark,
      key: `m-${i}`,
    });
    cursor = mark.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), mark: null, key: 'end' });
  }

  return segments.flatMap((seg) => {
    if (!seg.mark) {
      // plain text segment — preserve newlines
      return splitLines(seg.text, seg.key);
    }
    const style = {};
    if (seg.mark.backgroundColor) style.backgroundColor = seg.mark.backgroundColor;
    if (seg.mark.color) style.color = seg.mark.color;
    // marked segment — also split on newlines inside mark
    return seg.text.split('\n').flatMap((line, i, arr) => {
      const el = (
        <span
          key={`${seg.key}-l${i}`}
          style={style}
          className={`${seg.mark.bold ? 'font-bold' : ''} ${seg.mark.italic ? 'italic' : ''} ${seg.mark.underline ? 'underline' : ''} rounded px-0.5`}
        >
          {line}
        </span>
      );
      return i < arr.length - 1 ? [el, <br key={`${seg.key}-br${i}`} />] : [el];
    });
  });
}
