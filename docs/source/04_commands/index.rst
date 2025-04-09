コマンド
==================

基本操作
-------

ログレベルの設定変更
^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.setLogLevel  
- **タイトル:** Getterm: Set Log Level  
- **説明:**  
  ログ出力レベルを設定します。デバッグ時の情報確認に利用します。

  ログは以下の、getterm-log タグから参照可能です。

   .. image:: img/log_view.png
     :alt: getterm-db log view
     :width: 780px

リモートSSHビューを表示
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.showRemoteSSHView  
- **タイトル:** Getterm: Show remote SSH view  
- **説明:**  
  ナビゲーションビューに Remote-SSH の接続ホストリストを表示します。

   .. image:: img/remote-ssh-view.gif
     :alt: remote ssh view
     :width: 780px

SSH 接続
--------

VSCodeの左側のバー (Activity Bar) から、Remote Explorer を選択してホスト一覧を表示し、接続ホストを選択して右クリックしてコマンドを実行してください。

SSHターミナルを起動
^^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.openTerminalWithProfile  
- **タイトル:** Getterm: Open Terminal  
- **説明:**  
  対象ホストを右クリックし、**[Getterm: Open Terminal]** を選択すると、選択したプロファイルに基づいて SSH 接続が開始され、ターミナルが起動します。

SSHターミナル＋ノートブックを起動
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.openTerminalWithProfileAndCreateNotebook  
- **タイトル:** Getterm: Open Terminal & Create Notebook  
- **説明:**  
  対象ホストを右クリックし、**[Getterm: Open Terminal & Create Notebook]** を選択すると、SSH 接続が確立されると同時に新規ノートブックが作成され、ターミナル操作が自動的に記録されます。

端末操作
-------

ターミナルキャプチャー開始
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.startTerminalCapture  
- **タイトル:** Getterm: Start Terminal Capture  
- **説明:**  
  ターミナルパネル右側の端末リストを選択し、**右クリック** -> [**Getterm: Start Terminal Capture**] でターミナル出力のキャプチャーを開始します。キャプチャーした操作内容は、後でノートブックに記録されます。

シェル統合スクリプトのロード
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.loadShellIntegrationScript  
- **タイトル:** Getterm: Load shell integration script  
- **説明:**  
  シェル統合スクリプトをロードし、リモートホスト側のシェル統合機能を有効化します。  
  （suコマンドによるユーザー切り替えなどでシェル環境が変更された場合に再実行します。）

ノートブック操作
-----------

新規ノートブック作成
^^^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.createNewTerminalNotebook  
- **タイトル:** Getterm: Create new terminal notebook  
- **説明:**  
  端末操作記録用の新規ノートブックを作成します。

セッションを選択
^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.selectSession  
- **タイトル:** Select Session  
- **カテゴリー:** Notebook  
- **説明:**  
  ノートブックのメニューから、[**Select Session**] -> [**ターミナル名**] を選択し、端末接続と同時に記録を開始します。

   .. image:: img/select-session.gif
     :alt: select session
     :width: 780px

キャプチャーを停止
^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.stopCapture  
- **タイトル:** Stop Capture  
- **カテゴリー:** Notebook  
- **説明:**  
  ノートブックのメニューから [**Stop Capture**] を選択し、端末セッションのキャプチャーを停止します。記録の終了と端末セッションの切断を行います。

ミュート切り替え
^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.toggleMute  
- **タイトル:** Mute  
- **カテゴリー:** Notebook  
- **説明:**  
  ノートを開くと、ステータスバーに **Mute（ミュート）** または **Unmute（ミュート解除）** のラベルが表示され、クリックすることで状態を切り替えることができます。  
  ミュートがオン（Muted）の場合、ノートブックへの出力や記録が抑制され、端末の操作内容が記録されません。  
  動作確認などの操作を記録から除外したい場合は、ミュート機能を利用すると、後からノートを整理しやすくなります。

   .. image:: img/mute-mode.gif
     :alt: select session
     :width: 780px

Markdown セルを追加
^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.addMarkdownCell  
- **タイトル:** GetTerm: Add Markdown Header  
- **説明:**  
  ショートカット（CTRL+SHIFT+L）で実行され、ノートブックに見出し用の Markdown セルを追加します。

端末パネル最大化/最小化
^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.maximizeTerminalPanel  
- **タイトル:** Maximize Terminal Panel  
- **説明:**  
  ショートカット（`CTRL+SHIFT+K`）で実行すると、端末パネルのサイズを最大化または元に戻すトグル操作が行えます。  
  端末作業に集中したい場合に便利です。  

  また、VSCode の標準機能である `CTRL+@` を使用すると、端末パネルの最小化および再表示の切り替えが可能です。

  .. image:: img/toggle-view.gif
     :alt: toggle view
     :width: 780px

エクスポート操作
------------

Excel にエクスポート
^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.exportExcel  
- **タイトル:** Getterm: Export to Excel  
- **説明:**  
  ノートブックの内容を Excel 形式にエクスポートします。データの集計や作業レビューに利用します。  
  実行時には、以下のオプションを指定できます：

  - **セッション情報を含める:** セッションのホスト名、ユーザー名、接続時間などの詳細を出力に含めます。
  - **コマンド出力をエクスポート（既定）:** 実行したコマンドの出力内容をエクスポート対象とします（既定で有効）。
  - **コマンドメタ情報を含める:** コマンドの実行時間や終了コードなど、補足的な情報を含めます（Excel エクスポート時は既定で有効）。
  - **コマンド出力に見出しを付ける（Markdownのみ）:** Markdown 形式で出力する場合、各コマンド出力に見出し（ラベル）を追加します。
  - **出力行数の制限（開始／終了）:** コマンド出力の先頭と末尾から指定行数のみ保持します（初期値は5行）。
  - **エクスポート後にファイルを開く:** エクスポート完了後、自動的に出力ファイルを開きます（既定で有効）。

   .. image:: img/export-excel.gif
     :alt: select session
     :width: 780px

Markdown にエクスポート
^^^^^^^^^^^^^^^^^^^^^^^^

- **コマンド名:** getterm-db.exportMarkdown  
- **タイトル:** Getterm: Export to Markdown  
- **説明:**  
  ノートブックの内容を Markdown 形式にエクスポートします。ドキュメントとして再利用したり、Web サイトに掲載する際に便利です。  
  実行時には、以下のオプションを指定できます：

  - **セッション情報を含める:** セッションのホスト名、ユーザー名、接続時間などの詳細を出力に含めます。
  - **コマンド出力をエクスポート（既定）:** 実行したコマンドの出力内容をエクスポート対象とします（既定で有効）。
  - **コマンドメタ情報を含める:** コマンドの実行時間や終了コードなど、補足的な情報を含めます。
  - **コマンド出力に見出しを付ける（Markdownのみ）:** 各コマンド出力の前に、コマンド内容を見出し（`### コマンド名`）として記述します（既定で有効）。
  - **出力行数の制限（開始／終了）:** コマンド出力の先頭と末尾から指定行数のみ保持します（初期値は5行）。
  - **エクスポート後にファイルを開く:** エクスポート完了後、自動的に出力ファイルを開きます（既定で有効）。
