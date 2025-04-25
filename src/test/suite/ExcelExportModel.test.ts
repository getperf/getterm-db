
import * as assert from 'assert';
import { ExcelExportModel } from '../../exporter/ExcelExportModel'; // 適宜パスを修正

suite('ExcelExportModel.md2RichText', () => {
  test('should convert level 1 heading to richText with bold and size 13', () => {
    const md = "# Heading 1";
    const result = ExcelExportModel.md2RichText(md);
    // 見出しは2セグメント（テキストと改行）となるはず
    assert.strictEqual(result.richText.length, 1);
    assert.strictEqual(result.richText[0].text, "Heading 1");
    assert.deepStrictEqual(result.richText[0].font, { bold: true, size: 13 });
  });

  test('should convert level 2 heading to richText with bold and size 12', () => {
    const md = "## Heading 2";
    const result = ExcelExportModel.md2RichText(md);
    assert.strictEqual(result.richText.length, 1);
    assert.strictEqual(result.richText[0].text, "Heading 2");
    assert.deepStrictEqual(result.richText[0].font, { bold: true, size: 12 });
  });

  test('should convert level 3 heading to richText with bold and size 11', () => {
    const md = "### Heading 3";
    const result = ExcelExportModel.md2RichText(md);
    assert.strictEqual(result.richText.length, 1);
    assert.strictEqual(result.richText[0].text, "Heading 3");
    assert.deepStrictEqual(result.richText[0].font, { bold: true, size: 11 });
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
    assert.strictEqual(result.richText.length, 3);
    assert.deepStrictEqual(result.richText[0], { text: "Heading 2", font: { bold: true, size: 12 } });
    assert.strictEqual(result.richText[1].text, "Some text line.\n");
    assert.strictEqual(result.richText[2].text, "Another line.\n");
  });

  test('should convert heading 3 and heading 4 with correct font styles', () => {
    const md = `### 見出し3

  aaa

  #### 見出し4

  bbbb`;
    const result = ExcelExportModel.md2RichText(md);

    assert.strictEqual(result.richText.length, 7);

    assert.deepStrictEqual(result.richText[0], { text: "見出し3", font: { bold: true, size: 11 } });
    assert.strictEqual(result.richText[1].text, "\n");
    assert.strictEqual(result.richText[2].text, "aaa\n");
    assert.strictEqual(result.richText[3].text, "\n");
    assert.deepStrictEqual(result.richText[4], { text: "見出し4", font: { bold: true, size: 10 } });
    assert.strictEqual(result.richText[5].text, "\n");
    assert.strictEqual(result.richText[6].text, "bbbb\n");
  });

});
