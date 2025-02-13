
import * as assert from 'assert';
import { ExcelExportModel } from '../../exporter/ExcelExportModel'; // 適宜パスを修正

suite('ExcelExportModel.md2RichText', () => {
  test('should convert level 1 heading to richText with bold and size 13', () => {
    const md = "# Heading 1";
    const result = ExcelExportModel.md2RichText(md);
    // 見出しは2セグメント（テキストと改行）となるはず
    assert.strictEqual(result.richText.length, 2);
    assert.strictEqual(result.richText[0].text, "Heading 1");
    assert.deepStrictEqual(result.richText[0].font, { bold: true, size: 13 });
    assert.strictEqual(result.richText[1].text, "\n");
  });

  test('should convert level 2 heading to richText with bold and size 12', () => {
    const md = "## Heading 2";
    const result = ExcelExportModel.md2RichText(md);
    assert.strictEqual(result.richText.length, 2);
    assert.strictEqual(result.richText[0].text, "Heading 2");
    assert.deepStrictEqual(result.richText[0].font, { bold: true, size: 12 });
    assert.strictEqual(result.richText[1].text, "\n");
  });

  test('should convert level 3 heading to richText with bold and size 11', () => {
    const md = "### Heading 3";
    const result = ExcelExportModel.md2RichText(md);
    assert.strictEqual(result.richText.length, 2);
    assert.strictEqual(result.richText[0].text, "Heading 3");
    assert.deepStrictEqual(result.richText[0].font, { bold: true, size: 11 });
    assert.strictEqual(result.richText[1].text, "\n");
  });

  test('should convert non-heading text without font property', () => {
    const md = "This is a paragraph.";
    const result = ExcelExportModel.md2RichText(md);
    assert.strictEqual(result.richText.length, 1);
    assert.strictEqual(result.richText[0].text, "This is a paragraph.\n");
    assert.strictEqual(result.richText[0].font, undefined);
  });

  test('should process multiple lines correctly', () => {
    const md = `## Heading 2
Some text line.
Another line.`;
    const result = ExcelExportModel.md2RichText(md);
    // 想定されるセグメント:
    // - セグメント0: { text: "Heading 2", font: { bold: true, size: 12 } }
    // - セグメント1: { text: "\n" }
    // - セグメント2: { text: "Some text line.\n" }
    // - セグメント3: { text: "Another line.\n" }
    assert.strictEqual(result.richText.length, 4);
    assert.deepStrictEqual(result.richText[0], { text: "Heading 2", font: { bold: true, size: 12 } });
    assert.strictEqual(result.richText[1].text, "\n");
    assert.strictEqual(result.richText[2].text, "Some text line.\n");
    assert.strictEqual(result.richText[3].text, "Another line.\n");
  });
});
