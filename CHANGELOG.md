# Change Log

All notable changes to the "getterm-db" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0] - 2025-03-08

- Initial release

## [1.1.0] - 2025-03-15

### Added

- `iexpress` を使用して `getterm.bat` から `getterm.exe` を自動生成するスクリプトを追加 ([#12](https://github.com/getperf/getterm-db/issues/12))
- `npm run build-exe` で `.exe` を作成できるように `package.json` に `scripts` を追加

### Changed

- `getterm.bat` の実行方法を `.exe` に変更し、コンソールウィンドウが表示されないように改善

## [1.2.0] - 2025-03-15

### Added

- Markdownエクスポートでコマンド実行結果のキャプションに **Command Output:** を追加

### Changed

- Excelエクスポートの実行時間、終了コード出力オプションの規定値を有効化に変更

### Fixed

- sudo vi エディタ編集モードで、権限不足でキャプチャーに失敗する問題修正。キャプチャー実行時に sudo cat コマンドを追加
