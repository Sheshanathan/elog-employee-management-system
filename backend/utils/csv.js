function escapeCsvValue(value) {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadCSV(filename, rows, columns) {
    if (!rows || rows.length === 0) return;

    const headers = columns || Object.keys(rows[0]).map((key) => ({ key, label: key }));
    const headerLine = headers.map((col) => escapeCsvValue(col.label)).join(",");

    const lines = rows.map((row) =>
        headers
            .map((col) => escapeCsvValue(col.format ? col.format(row) : row[col.key]))
            .join(",")
    );

    const blob = new Blob([[headerLine, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** Parses CSV text (handles quoted fields with commas) into an array of row objects keyed by the header row. */
export function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') { field += '"'; i++; }
            else if (char === '"') { inQuotes = false; }
            else { field += char; }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            row.push(field); field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && next === "\n") i++;
            row.push(field); rows.push(row); row = []; field = "";
        } else {
            field += char;
        }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

    const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
    if (nonEmpty.length === 0) return [];

    const headers = nonEmpty[0].map((h) => h.trim());
    return nonEmpty.slice(1).map((r) => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (r[i] || "").trim(); });
        return obj;
    });
}