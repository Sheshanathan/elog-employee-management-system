export const downloadCSV = (filename, data, columns) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const headers = columns.map((column) => column.label);

  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      columns
        .map((column) => {
          let value = column.format
            ? column.format(row)
            : row[column.key];

          // Handle all empty/null/undefined values
          if (value === null || value === undefined || value === "") {
            value = "";
          }

          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  // UTF-8 BOM for proper Excel character handling
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const parseCSV = (text) => {
  if (!text || !text.trim()) return [];

  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(value);
      value = "";

      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
    } else {
      value += char;
    }
  }

  // Add final value/row
  if (value !== "" || row.length > 0) {
    row.push(value);

    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((header) =>
    header.trim()
  );

  return rows.slice(1).map((values) => {
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim() ?? "";
      return obj;
    }, {});
  });
};