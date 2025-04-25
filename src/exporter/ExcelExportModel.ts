import * as vscode from "vscode";
import ExcelJS from "exceljs";

// ExcelJS の richText 用のセグメント型（ExcelJS でも同様の型を利用できます）
interface RichTextSegment {
    text: string;
    font?: { bold?: boolean; size?: number };
}
  
// 列定義の型
type ColumnDefinition = {
    header: string;
    key: string;
    width: number;
    alignment: Partial<ExcelJS.Alignment>;
};

// 列定義
const columns: ColumnDefinition[] = [
    {
        header: "StepNo",
        key: "position",
        width: 8,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "Description",
        key: "description",
        width: 30,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
    {
        header: "Command",
        key: "command",
        width: 40,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
    {
        header: "Output",
        key: "output",
        width: 60,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
    {
        header: "Start Time",
        key: "start",
        width: 12,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "End Time",
        key: "end",
        width: 12,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "Duration",
        key: "duration",
        width: 10,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "Exit",
        key: "exit_code",
        width: 5,
        alignment: { vertical: "top", horizontal: "center" },
    },
    {
        header: "Misc",
        key: "misc",
        width: 40,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
];

export class ExcelExportModel {
    /**
     * Formats a cell in the worksheet.
     */
    static formatCell(cell: ExcelJS.Cell, colNumber: number, rowIndex: number) {
        // Add border to each cell
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };

        // Set alignment to top and wrap text
        cell.alignment = {
            vertical: "top",
            wrapText: true,
        };

        // Apply alignment from the column definitions
        const columnDef = columns[colNumber - 1]; // 1-based index
        if (columnDef?.alignment) {
            cell.alignment = columnDef.alignment;
        }

        // Apply special styles for the header row
        if (rowIndex === 1) {
            cell.font = { bold: true }; // Bold header
            // Left-aligned
            cell.alignment = { horizontal: "left", vertical: "middle" };
        }
    }

    /**
     * Calculates the row height based on the content length.
     */
    static calculateRowHeight(values: { [key: number]: string }): number {
        const estimatedHeight = Object.entries(values).reduce((
            maxHeight, [index, text]
        ) => {
            const colIndex = parseInt(index, 10) - 1;
            // 対応するカラムの width を取得。未定義の場合はデフォルト60を使用
            const colWidth = columns[colIndex]?.width || 60;
            const estimatedLineCount = Math.ceil(text.length / colWidth);
            return Math.max(maxHeight, estimatedLineCount);
        }, 1);
        return estimatedHeight * 30; // Multiply by a base height factor
    }

    /**
     * Adjusts the height of a row based on its content.
     */
    static adjustRowHeight(row: ExcelJS.Row, rowIndex: number) {
        if (rowIndex === 1) {
            row.height = 25; // Header row
            return;
        }
        const validValues = ((row.values as (string | undefined)[]) || []).reduce((
            acc, val, index
        ) => {
            if (index !== 0 && typeof val === "string") {
                acc[index] = val || "";
            }
            return acc;
        }, {} as { [key: number]: string });
        row.height = this.calculateRowHeight(validValues);
    }

    static applyExitCodeFormatting(row: ExcelJS.Row, rowIndex: number) {
        if (rowIndex === 1) {
            return;
        }
        const exitCodeCell = row.getCell("exit_code"); // Use the column key
        if (exitCodeCell.value === null) {
            // Handle null
            exitCodeCell.value = "-";
            return;
        }
        const exitCode = Number(exitCodeCell.value);
        if (Number.isNaN(exitCode)) {
            return;
        }
        if (exitCode === 0) {
            exitCodeCell.value = "OK";
            exitCodeCell.font = { color: { argb: "99009900" } }; // Green color
        } else {
            exitCodeCell.value = `NG(${exitCode})`;
            exitCodeCell.font = { color: { argb: "99990000" } }; // Red color
        }
    }

    static setWorksheetColumns(worksheet: ExcelJS.Worksheet) {
        // Add Columns
        worksheet.columns = columns.map((col) => ({
            header: col.header,
            key: col.key,
            width: col.width,
        }));
    }

    static async addDownloadedContentSheet(
        title: string, 
        text: string, 
        workbook: ExcelJS.Workbook
    ) : Promise<ExcelJS.Worksheet> {
        const worksheet = workbook.addWorksheet(title);
        const fixedWidthFont = { name: 'Courier New', size: 11 };

        // 各行の文字数の最大値を計算（先頭や末尾の空白、タブもそのまま含む）
        const lines = text.split(/\r?\n/);
        const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0);
        worksheet.getColumn(1).width = maxLineLength + 2;

        lines.forEach((line) => {
            console.log("Adding line:", line);
            // const row = worksheet.addRow([{ richText: [{ text: line }] }]);

            const row = worksheet.addRow([]);
            const cell = row.getCell(1);
            cell.numFmt = '@';
            // TODO : 先頭の空行がトリムされる問題を修正
            cell.value = line;
            cell.font = fixedWidthFont;
            // row.getCell(1).value = ;
            // row.getCell(1).font = fixedWidthFont;
        });

        // 範囲全体の外枠を設定
        const startRow = 1;
        const endRow = worksheet.rowCount;
        for (let i = startRow; i <= endRow; i++) {
            const cell = worksheet.getCell(`A${i}`);
            const border: Partial<ExcelJS.Borders> = {};
            if (i === startRow) { border.top = { style: 'thin' }; }
            if (i === endRow) {border.bottom = { style: 'thin' }; }
            border.left = { style: 'thin' };
            border.right = { style: 'thin' };
            cell.border = border;
        }

        return worksheet;
    }

    static md2RichText(text: string): { richText: RichTextSegment[] } {
        const segments: RichTextSegment[] = [];
        const lines = text.split(/\n/);

        lines.forEach((line) => {
          line = line.trim();

          if (line.startsWith("#")) {
            // 見出しの場合：正規表現でレベルと内容を抽出
            const match = line.match(/^(#+)\s+(.*)$/);
            if (match) {
              const level = match[1].length;
              const content = match[2].trim();
              let size = 13; // レベル1のデフォルト
              if (level === 2) {
                size = 12;
              } else if (level === 3) {
                size = 11;
              } else if (level >= 4) {
                size = 10;
              } else if (level >= 5) {
                size = 9;
              }
              segments.push({
                text: content,
                font: { bold: true, size: size },
              });
            } else {
              segments.push({ text: line + "\n" });
            }
          } else {
            segments.push({ text: line + "\n" });
          }
        });
        return { richText: segments };
    }
      
}
