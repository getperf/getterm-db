import * as vscode from "vscode";
import ExcelJS from "exceljs";

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
        width: 40,
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
        return estimatedHeight * 20; // Multiply by a base height factor
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
}
