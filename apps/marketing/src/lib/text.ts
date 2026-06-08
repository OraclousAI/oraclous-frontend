/** Strip inline markdown so text lands clean in JSON-LD (links, code, bold, italic). */
export function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/`([^`]+)`/g, '$1') // `code` → code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** → bold
    .replace(/\*([^*]+)\*/g, '$1') // *italic* → italic
    .replace(/_([^_]+)_/g, '$1') // _italic_ → italic
    .trim();
}
