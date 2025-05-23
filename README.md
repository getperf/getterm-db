# GetTerm: Terminal Capture Tool

GetTerm is a software that integrates a terminal with a text editor. Designed to enhance the efficiency of server management and operations, it automatically records terminal activity and logs the content to a notebook.

![GetTerm usage](assets/getterm-usage.gif)

GetTerm offers the following features to optimize terminal operations in server management:

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

- **CTRL+SHIFT+J**  
    → Toggles the mute function on and off. When mute is enabled, terminal logs are not written to the notebook.

## Installation

**Note:** Supported on Windows 11 and Windows Server 2019 or later, which include the OpenSSH client by default.

Since Getterm utilizes the VSCode Proposal API, it must be used with [**VSCode Insiders**](https://code.visualstudio.com/insiders) rather than the standard VSCode version.

1. **Launch VSCode Insiders**
    
    - Install and launch [VSCode Insiders](https://code.visualstudio.com/insiders).

2. **Install the Getterm Extension**
    
    - Download and unzip [`getterm-x.x.x.zip`](https://github.com/getperf/getterm/tags).
    - In VSCode Insiders, click the ellipsis (`...`) in the upper right corner of the Extensions view and select **Install from VSIX...**.
    - Navigate to the unzipped folder and select the `getterm-db-x.x.x.vsix` file to install the extension.

## Usage

### 1. Execute the VSCode Insiders Launch Script

- Execute **getterm.exe** from the extracted folder.
- This command launches VSCode Insiders with the Proposal API feature enabled.

### 2. Connect to a Server and Create a Notebook

- After launching, click the **SSH** icon in the activity bar.
- For a new connection, click **Edit** in the top right of the **SSH** navigation view and register a new host.
- Right-click on an existing connection host icon and select **Getterm: Open Terminal & Create Notebook** to establish an SSH connection to the target host.
- The SSH connection will be initiated, and the shell integration script will automatically load on the remote host.

### 3. Start Recording Terminal Operations

- Once the SSH connection is established, terminal operations are automatically recorded and their content is reflected in the notebook.
- When working with the terminal and notebook, please also use the following shortcut keys:
    - **CTRL+SHIFT+L**: Adds a Markdown header cell to the notebook.
    - **CTRL+SHIFT+K**: Toggles the terminal panel between maximized and normal (On/Off).
    - **CTRL+SHIFT+J**: Toggles the mute function on and off.

## Notes

- After establishing an SSH connection, `vscode-shell-integration.sh` is automatically loaded to enable the shell integration API.
- `vscode-shell-integration.sh` adds escape sequences to indicate the start and end of command executions. VS Code reads these escape sequences to integrate with the shell integration API.
- To persist shell integration, please add the following line to your .bash_profile:

    ```bash
    vi ~/.bash_profile
    # Append the following line at the end
    source "${HOME}/.getterm/vscode-shell-integration.sh"
    ```

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

### SSH Connection

Use the Remote Explorer provided by Remote-SSH to display the list of hosts. Then, right-click on the target host to execute the command.

- **`getterm-db.openTerminalWithProfile`**  
    **Title:** Getterm: Open Terminal  
    **Description:**  
    Right-click on the target host and select **[Getterm: Open Terminal]**. This will initiate an SSH connection based on the selected profile and open a terminal.
    
- **`getterm-db.openTerminalWithProfileAndCreateNotebook`**  
    **Title:** Getterm: Open Terminal & Create Notebook  
    **Description:**  
    Right-click on the target host and choose **[Getterm: Open Terminal & Create Notebook]**. This command establishes an SSH connection and simultaneously creates a new notebook, automatically logging your terminal activity.    

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
    
- **`getterm-db.toggleMute`**  
    **Title:** Mute  
    **Category:** Notebook  
    **Description:**
    When a notebook is open, the status bar displays **Mute** or **Unmute**, allowing you to toggle the mute function by executing this command or clicking the label.
    When mute is enabled (Muted), output and logging to the notebook are suppressed, and terminal logs are not recorded.

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


# Vulnerability Management Policy

In this project, dependency vulnerabilities are regularly checked using `npm audit` and Snyk, and dependency packages are updated as needed. GitHub’s Dependabot is also enabled, and we are committed to promptly addressing any detected vulnerabilities.

## Contributing

Contributions to this project are welcome! You can participate by following these steps:

Clone the GitHub repository and share your feedback via pull requests or issues:

```bash
git clone https://github.com/getperf/getterm-db.git
```
