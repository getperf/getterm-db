チュートリアル
==================

前提条件
--------

このチュートリアルでは、Linux サーバーへの SSH 接続を通じて、ターミナル操作を記録する方法を紹介します。  
GetTerm を使用する際、`sudo` コマンドを多く使用する場合がありますので、接続ユーザーに sudo 権限を付与してください。

.. code-block:: shell

    sudo usermod -aG wheel <ユーザー名>

本チュートリアルでは以下のサーバー接続例を使用します：

- **IP アドレス** : 192.168.40.131  
- **OSユーザー** : frsw3

まず、ダウンロードしたフォルダから **getterm.exe** を起動してください。

作業手順の開始
----------------

1. **SSH 接続設定を行う**

   アクティビティバーから [SSH] アイコンをクリックし、  
   SSH HOSTS ビューの画面左上の「Edit」をクリックします。

   .. image:: img/ssh_hosts.png
      :alt: SSH Host
      :width: 780px

   以下のようにホスト情報を記入してください。

   .. code-block:: sshconfig

       Host vmtest01
           HostName 192.168.40.131
           User frsw3

   保存後、リストから作成したホストを右クリックし「Getterm : Open terminal」を選択します。

2. **パスワードの入力とシェル選択**

   接続時にパスワードを入力してください。

   .. image:: img/enter_password.png
      :alt: Enter password
      :width: 780px

   シェルの種類を選択する画面では `bash` を選択します。

   .. image:: img/select_login_shell.png
      :alt: Select login shell
      :width: 780px

3. **シェル統合 API の読み込み**

   接続後、以下のようにシェル統合スクリプトが自動でロードされます。

   .. image:: img/load_shell_integration_api.png
      :alt: Load Shell Integration API
      :width: 780px

   ターミナル画面の左下側にコマンドマーカー（〇）が表示されれば、
   準備完了です。

   永続化設定として、以下を `.bash_profile` に追加してください。

   .. code-block:: shell

       echo source "$HOME/.getterm/vscode-shell-integration.sh" >> ~/.bash_profile

ノートブックの作成
--------------------

1. `Ctrl + Shift + P` を押してコマンドパレットを開き、「create new terminal notebook」と入力します。

   .. image:: img/create_terminal_notebook.png
      :alt: Create terminal notebook
      :width: 780px

2. 表示されたコマンドでノートブックを作成し、ファイル名は「VM操作テスト」とします。

3. ノートブックのメニューから「Select session」を選択し、キャプチャー対象のターミナルを選びます。

   .. image:: img/select_session.png
      :alt: Select Session
      :width: 780px

ターミナル操作の記録
----------------------

1. `Ctrl + Shift + K` を押すことでターミナルを全画面表示に切り替えられます。

   `Ctrl + Shift + K` を再度押すことで元の2画面に戻ります。

   .. note:: 通常はターミナルの全体画面を使用してください。

2. 以下の操作例を実行し、ターミナル操作を記録してみましょう。

   - **見出しの挿入**

     `Ctrl + Shift + L` → 「Heading 2(##)」 → 「ホスト名とIPアドレスを編集」と入力

   - **/etc/hosts 編集**

     ターミナル画面から以下を入力します。

     .. code-block:: shell

         sudo vi /etc/hosts

     以下例の通りIPアドレスとホストの行を編集します。
     編集例：

     .. code-block:: text

         192.168.40.131 vmtest01 

     保存終了時、「Yes」でダウンロードを確認します。

     .. image:: img/vi_download_mode.png
        :alt: vi download
        :width: 780px

     `Ctrl + Shift + K` を押して、ノートブックを表示すると以下画面となります。


     .. image:: img/vi_download_note.png
        :alt: vi note
        :width: 780px

     「Download file here」をクリックすると編集ファイルが確認できます。

3. **ping コマンドの実行とトラブル対応**

   - `Ctrl + Shift + L` で見出し追加：「ping で疎通確認」

   - ターミナルから以下を入力

     .. code-block:: shell

         ping vmtest1

   ここでは誤ったホスト名でpingを実行してエラーとなりました。
   想定外の操作となったため、調査のための見出しを追加します。

   - `Ctrl + Shift + L` で見出し追加：「ping 不通調査」

   - 正しいホスト名で ping を実行し、`Ctrl + C` で停止します。

     .. code-block:: shell

         ping vmtest01

   .. note::

      ターミナル操作では意図しない動作や調査が発生しがちです。  
      ノートブック上で見出しやコメントを活用し、操作の意図や調査過程を記録することを推奨します。

      ChatGPTなどで調査した内容がある場合も、該当セルに記載しておくと便利です。

   - ノートブックは以下の表示となります。

     .. image:: img/ping_note.png
        :alt: ping note
        :width: 780px

4. **ターミナル操作終了**

   - ターミナル画面から `Ctrl + D` でログアウトし、キャプチャーを終了します。

操作の振り返りとエクスポート
------------------------------

この手順では、ターミナルでの操作履歴を Excel にエクスポートし、想定外の操作や調査の記録を整理します。  
特に障害対応や原因調査時のメモを残すことで、後からの振り返りやナレッジ共有に役立ちます。

1. `Ctrl + Shift + P` を押してコマンドパレットを開き、「Export to Excel」と入力して実行します。

   .. image:: img/export_excel.png
      :alt: Export to Excel
      :width: 780px

2. 実行オプションは既定のままで問題ありません。

   .. image:: img/export_excel2.png
      :alt: Export to Excel
      :width: 1280px

3. Excel ファイルの **Misc** 列には、以下のような形式でメモを記載することをおすすめします：

   **備考欄の記入例：**

   - `make html` ではなく、正しくは `make.bat html`
   - `requirements.txt` の `sphinx_rtd_theme==1.0.0` の記述に誤りがあり修正
   - `sudo vi` 実行後に保存忘れで変更反映されず、再編集が必要だった
   - `ping` が通らなかったため、`/etc/hosts` の IP を確認・修正
   - 誤って `root` ユーザーで作業したため、パーミッションを修正
   - `dnf install` で依存エラー発生、リポジトリ設定を見直して解決

こうしたメモを残すことで、同様の作業時に再発防止・手戻りの削減につながります。
