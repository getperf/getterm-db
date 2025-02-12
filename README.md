# Getterm: Terminal Capture Tool

Getterm is a software that integrates a terminal with a text editor. Designed to enhance the efficiency of server management and operations, it automatically records terminal activity and logs the content to a notebook.

![Getterm usage](assets/getterm-usage.gif)

Getterm offers the following features to optimize terminal operations in server management:

## Key Features

1. **Automatic Recording of Terminal Operations**  
    After establishing an SSH connection, terminal activities are recorded in real time and automatically reflected in a notebook.
    
2. **Creation of Server Procedure Documentation**  
    It automatically records the results of operation simulations performed in a test environment, allowing you to generate procedure documents for review purposes.
    
3. **Production Server Deployment Logging**  
    Commands executed in the production environment are logged, and an execution report is generated that includes detailed information such as start and end times.

## Shortcut Keys

To support the integration between the terminal and the notebook, please use the following shortcut keys:

- **CTRL+SHIFT+L**  
    → Adds a Markdown cell for headers to the notebook.  
    (This is used to organize recorded content and clearly delineate work sections.)
    
- **CTRL+SHIFT+K**  
    → Toggles the terminal panel between maximized and normal sizes.  
    (This is useful for expanding your workspace to concentrate on terminal operations.)

## Installation

Since Getterm utilizes the VSCode Proposal API, it must be used with [**VSCode Insiders**](https://code.visualstudio.com/insiders) rather than the standard VSCode version.

1. **Launch VSCode Insiders**
    
    - Install and launch [VSCode Insiders](https://code.visualstudio.com/insiders).

2. **Install the Remote - SSH Extension**
    
    - Open the Extensions view in VSCode Insiders from the activity bar, search for "remote-ssh," and install the extension.

3. **Install the Getterm Extension**
    
    - Download and unzip [`getterm-x.x.x.zip`](https://github.com/getperf/getterm/tags).
    - In VSCode Insiders, click the ellipsis (`...`) in the upper right corner of the Extensions view and select **Install from VSIX...**.
    - Navigate to the unzipped folder and select the `getterm-x.x.x.vsix` file to install the extension.

## Usage

### 1. Execute the VSCode Insiders Launch Script

- Run the launch script located in the unzipped folder:
    
    ```powershell
    .\getterm.bat {working directory (optional)}
    ```

- This script launches VSCode Insiders with the Proposal API enabled.
    

### 2. Connect to a Server and Create a Notebook

- After launching, click the **Remote - SSH** icon in the activity bar.
- Right-click on an existing connection host icon and select **Getterm: Open Terminal & Create Notebook** to establish an SSH connection to the target host.
- The SSH connection will be initiated, and the shell integration script will automatically load on the remote host.

### 3. Start Recording Terminal Operations

- Once the SSH connection is established, terminal operations are automatically recorded and their content is reflected in the notebook.
- When working with the terminal and notebook, please also use the following shortcut keys:
    - **CTRL+SHIFT+L**: Adds a Markdown header cell to the notebook.
    - **CTRL+SHIFT+K**: Toggles the terminal panel between maximized and normal (On/Off).

## Commands

### Basic Operations

- **`getterm-db.setLogLevel`**  
    **Title:** Getterm: Set Log Level  
    **Description:**  
    Sets the log output level, which is useful for checking debug information during troubleshooting.
    
- **`getterm-db.showRemoteSSHView`**  
    **Title:** Getterm: Show remote SSH view  
    **Description:**  
    Displays the list of Remote-SSH connection hosts in the navigation view.
    

### SSH Connection Related

- **`getterm-db.openTerminalWithProfile`**  
    **Title:** Getterm: Open Terminal  
    **Description:**  
    Select a host from the Remote-SSH connection list and launch a terminal by right-clicking on it.  
    _After execution, an SSH connection is initiated based on the selected profile._
    
- **`getterm-db.openTerminalWithProfileAndCreateNotebook`**  
    **Title:** Getterm: Open Terminal & Create Notebook  
    **Description:**  
    Select a host from the Remote-SSH connection list and right-click to launch a terminal while simultaneously creating a new notebook.  
    _After connecting, terminal operations are recorded and automatically reflected in the notebook._
    

### Terminal Operations

- **`getterm-db.startTerminalCapture`**  
    **Title:** Getterm: Start Terminal Capture  
    **Description:**  
    Right-click on an entry in the terminal list (displayed on the right side of the terminal panel) and select **Getterm: Start Terminal Capture** to begin capturing terminal output. The recorded operations will later be logged in the notebook.
    
- **`getterm-db.loadShellIntegrationScript`**  
    **Title:** Getterm: Load Shell Integration Script  
    **Description:**  
    Loads the shell integration script to enable shell integration functionality on the remote host.  
    _(Re-run this command if the shell environment changes—for example, due to a user switch using the su command.)_
    

### Notebook Operations

- **`getterm-db.createNewTerminalNotebook`**  
    **Title:** Getterm: Create New Terminal Notebook  
    **Description:**  
    Creates a new notebook for recording terminal operations.
    
- **`getterm-db.selectSession`**  
    **Title:** Select Session  
    **Category:** Notebook  
    **Description:**  
    In the notebook menu, select [**Select Session**] → [**Terminal Name**] to initiate a terminal session and start recording.
    
- **`getterm-db.stopCapture`**  
    **Title:** Stop Capture  
    **Category:** Notebook  
    **Description:**  
    In the notebook menu, select [**Stop Capture**] to halt terminal capture, ending the recording and disconnecting the terminal session.
    
- **`getterm-db.addMarkdownCell`**  
    **Title:** GetTerm: Add Markdown Header  
    **Description:**  
    Executed via the shortcut (CTRL+SHIFT+L), this command adds a Markdown header cell to the notebook.
    
- **`getterm-db.maximizeTerminalPanel`**  
    **Title:** Maximize Terminal Panel  
    **Description:**  
    Executed via the shortcut (CTRL+SHIFT+K), this command toggles the terminal panel between maximized and normal sizes. Use it to maximize your view when you need to focus on terminal operations.
    

### Export Operations

- **`getterm-db.exportExcel`**  
    **Title:** Getterm: Export to Excel  
    **Description:**  
    Exports the contents of the notebook to Excel format for data aggregation and review.
    
- **`getterm-db.exportMarkdown`**  
    **Title:** Getterm: Export to Markdown  
    **Description:**  
    Exports the notebook’s content to Markdown format, making it reusable as documentation or for web publication.

## Notes

- For new connections, open the **Remote - SSH** navigation view, click the + icon on the right side of an SSH entry, and register a new connection host.
- After an SSH connection is established, the `vscode-shell-integration.sh` script is automatically loaded to enable the shell integration API.
- The `vscode-shell-integration.sh` script appends escape sequences that indicate command start and end events. VS Code reads these sequences and integrates them with the shell integration API.
- To persist shell integration, please add the following line to your .bash_profile:

    ```bash
    vi ~/.bash_profile
    # Append the following line at the end
    source "${HOME}/.getterm/vscode-shell-integration.sh"
    ```

## Contributing

Contributions to this project are welcome! You can participate by following these steps:

Clone the GitHub repository and share your feedback via pull requests or issues:

```bash
git clone https://github.com/getperf/getterm.git
```
