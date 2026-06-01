export function renderMarkedText(text = '', marks = []) {
  if (!marks?.length) return text;

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

  return segments.map((seg) => {
    if (!seg.mark) return <span key={seg.key}>{seg.text}</span>;
    const style = {};
    if (seg.mark.backgroundColor) style.backgroundColor = seg.mark.backgroundColor;
    if (seg.mark.color) style.color = seg.mark.color;
    return (
      <span
        key={seg.key}
        style={style}
        className={`${seg.mark.bold ? 'font-bold' : ''} ${seg.mark.italic ? 'italic' : ''} ${seg.mark.underline ? 'underline' : ''} rounded px-0.5`}
      >
        {seg.text}
      </span>
    );
  });
}
