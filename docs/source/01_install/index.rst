インストール方法
==================

本ドキュメントでは、Getterm の利用に必要な環境の準備と、拡張機能のインストール方法を解説します。

インストール要件
----------------

以下の環境が必要です。

- **プロセッサ**:  
  x86/x64 対応のプロセッサを搭載した PC（Windows 11 または Windows Server 2019 に対応していること）

- **メモリ**:  
  最低 4GB（快適な動作には 8GB 以上を推奨します。VSCode や拡張機能が安定して動作するためです）

- **ディスク容量**:  
  VSCode Insiders や拡張機能のインストール、および関連ファイル（キャッシュやログなど）を含めて、最低でも 300MB 以上の空き容量が必要です

- **Visual Studio Code Insiders**:  
  Getterm は VSCode の提案API（Proposed API）を使用しているため、通常の VSCode では動作しません。Insiders 版の使用が必須です。

VSCode Insiders のインストール
------------------------------

Getterm を利用するには、まず [**Visual Studio Code Insiders**](https://code.visualstudio.com/insiders) をインストールしてください。

1. 上記リンク先から VSCode Insiders のインストーラをダウンロードします。

2. ダウンロードしたインストーラを実行し、画面の指示に従ってインストールを進めます。

3. インストールが完了したら、**VSCode Insiders を起動**します。

Getterm 拡張機能のインストール
------------------------------

Getterm 拡張機能は GitHub のリリースページからインストールできます。

1. 以下のリンクから、最新のリリースタグを選択してください。

   - `getterm-x.x.x.zip` をダウンロードして、任意の場所に解凍します。  
     (https://github.com/getperf/getterm-db/releases)

   .. image:: img/download.png
      :alt: ダウンロード画面
      :width: 1280px

2. VSCode Insiders を起動し、左側のサイドバーから拡張機能ビュー（Extensions）を開きます。

3. 拡張機能ビュー右上の「︙（三点リーダー）」ボタンをクリックし、**「Install from VSIX...」** を選択します。

   .. image:: img/installvsix.png
      :alt: VSIX からインストールメニュー
      :width: 1280px

4. 解凍したフォルダ内の `getterm-db-x.x.x.vsix` ファイルを選択し、インストールを実行します。

   .. image:: img/installvsix2.png
      :alt: VSIX ファイル選択
      :width: 1280px

インストールが完了すると、拡張機能一覧に Getterm が追加され、すぐに使用できるようになります。

実行は解凍したフォルダーの **getterm.exe** を実行してください。

開発環境でのコンパイル
------------------

以下の手順で開発環境にてソースコードのコンパイルを行います。

.. code-block:: bash

   # リポジトリをクローンします
   git clone https://github.com/getperf/getterm-db

   # 作業ディレクトリに移動します
   cd getterm-db

   # 必要な依存パッケージをインストールします
   npm install

   # テストを実行して動作確認を行います
   npm run test

   # ビルド前に一度クリーンアップを行います
   npm run clean

   # プロジェクトをパッケージングします
   npm run package

各コマンドは開発環境での確認やビルドに必要です。特に ``npm install`` は初回実行時に必須となります。
