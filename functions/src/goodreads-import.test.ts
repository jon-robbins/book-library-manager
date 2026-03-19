import { describe, it, expect } from "@jest/globals";

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Simple CSV parser for Goodreads exports.
 * Handles quoted fields and escaped quotes.
 */
function parseGoodreadsCSV(csv: string): Array<Record<string, string>> {
  const lines = csv.split("\n");
  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const rows: Array<Record<string, string>> = [];
  let i = 1;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // Handle multiline quoted fields
    let fullLine = line;
    let quoteCount = (line.match(/"/g) || []).length;
    i++;
    while (quoteCount % 2 !== 0 && i < lines.length) {
      fullLine += "\n" + lines[i];
      quoteCount += (lines[i].match(/"/g) || []).length;
      i++;
    }

    const values = parseCSVLine(fullLine);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

describe("Goodreads CSV Parser", () => {
  describe("parseCSVLine", () => {
    it("should parse simple comma-separated values", () => {
      const result = parseCSVLine('field1,field2,field3');
      expect(result).toEqual(["field1", "field2", "field3"]);
    });

    it("should handle quoted fields with commas", () => {
      const result = parseCSVLine('field1,"field, with comma",field3');
      expect(result).toEqual(["field1", "field, with comma", "field3"]);
    });

    it("should handle escaped quotes", () => {
      const result = parseCSVLine('"field with ""quotes""",field2');
      expect(result).toEqual(['field with "quotes"', "field2"]);
    });

    it("should trim whitespace around fields", () => {
      const result = parseCSVLine(' field1 , field2 , field3 ');
      expect(result).toEqual(["field1", "field2", "field3"]);
    });

    it("should handle empty fields", () => {
      const result = parseCSVLine('field1,,field3');
      expect(result).toEqual(["field1", "", "field3"]);
    });

    it("should handle quoted empty fields", () => {
      const result = parseCSVLine('field1,"",field3');
      expect(result).toEqual(["field1", "", "field3"]);
    });

    it("should handle complex quotes", () => {
      const result = parseCSVLine('"Title with, comma and ""quotes""","Author Name"');
      expect(result).toEqual(
        ['Title with, comma and "quotes"', "Author Name"]
      );
    });
  });

  describe("parseGoodreadsCSV", () => {
    it("should parse valid Goodreads CSV with headers", () => {
      const csv = `Title,Author,ISBN
"1984","George Orwell","0451524934"
"Brave New World","Aldous Huxley","0060085061"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        Title: "1984",
        Author: "George Orwell",
        ISBN: "0451524934",
      });
      expect(result[1]).toEqual({
        Title: "Brave New World",
        Author: "Aldous Huxley",
        ISBN: "0060085061",
      });
    });

    it("should handle Goodreads export format with quotes", () => {
      const csv = `Book Id,Title,Author,ISBN ("")
1,1984,George Orwell,"0451524934"
2,"Brave New World","Aldous Huxley","0060085061"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        "Book Id": "1",
        Title: "1984",
        Author: "George Orwell",
        "ISBN ()": "0451524934",
      });
    });

    it("should skip empty lines", () => {
      const csv = `Title,Author
"Book1","Author1"

"Book2","Author2"
`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].Title).toEqual("Book1");
      expect(result[1].Title).toEqual("Book2");
    });

    it("should handle multiline quoted fields", () => {
      const csv = `Title,Description
"Book Title","A description
with newlines
inside quotes"
"Another Book","Simple description"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].Description).toContain("newlines");
    });

    it("should return empty array for empty CSV", () => {
      const result = parseGoodreadsCSV("");
      expect(result).toEqual([]);
    });

    it("should handle CSV with only headers", () => {
      const csv = "Title,Author,ISBN";
      const result = parseGoodreadsCSV(csv);
      expect(result).toEqual([]);
    });

    it("should handle fields with special characters", () => {
      const csv = `Title,Author
"The C++ Programming Language","Bjarne Stroustrup"
"C# & the .NET Framework","Someone"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].Title).toEqual("The C++ Programming Language");
      expect(result[1].Author).toEqual("Someone");
    });
  });

  describe("Edge cases", () => {
    it("should handle ISBN with non-digit characters", () => {
      const csv = `Title,Author,ISBN
"Book","Author","0-451-52493-4"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0].ISBN).toEqual("0-451-52493-4");
    });

    it("should handle missing ISBN field", () => {
      const csv = `Title,Author
"Book1","Author1"
"Book2","Author2"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("ISBN");
    });

    it("should handle mixed quote styles in titles", () => {
      const csv = `Title,Author
"Book with 'single quotes'","Author Name"
"Book with \\"escaped\\" quotes","Another Author"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
    });

    it("should handle extra commas at end of line", () => {
      const csv = `Title,Author,Extra
"Book1","Author1",
"Book2","Author2","Value"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("Title", "Book1");
      expect(result[1]).toHaveProperty("Extra", "Value");
    });

    it("should handle very large CSV with many rows", () => {
      let csv = "Title,Author,ISBN\n";
      for (let i = 0; i < 1000; i++) {
        csv += `"Book${i}","Author${i}","${String(i).padStart(10, '0')}"\n`;
      }

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(1000);
      expect(result[0].Title).toEqual("Book0");
      expect(result[999].Title).toEqual("Book999");
    });

    it("should handle consecutive quotes", () => {
      const csv = `Title,Author
"Book with ""multiple"" ""quotes""","Author"`;

      const result = parseGoodreadsCSV(csv);
      expect(result).toHaveLength(1);
      // The parser should handle escaped quotes
      expect(result[0].Title).toContain("multiple");
    });
  });
});
