import { basename } from 'path';
import * as vscode from 'vscode';
import {
  ExtensionContext,
  TextEdit,
  TextDocument,
  Position,
  Range,
  workspace,
  window
} from 'vscode';

import {
  extractHeader,
  getHeaderInfo,
  renderHeader,
  supportsLanguage,
  HeaderInfo
} from './header';

const HEADER_LINE_COUNT = 11;
const HEADER_RANGE = new Range(0, 0, HEADER_LINE_COUNT, 0);
const updatingDocuments = new Set<string>();

const getCurrentUser = (): string => {
  const config = workspace.getConfiguration();
  return config.get<string>('42header.username') || process.env['USER'] || 'marvin';
};

const getCurrentUserMail = (user: string): string => {
  const config = workspace.getConfiguration();
  return config.get<string>('42header.email') || `${user}@student.42belgium.be`;
};

const newHeaderInfo = (document: TextDocument, headerInfo?: HeaderInfo): HeaderInfo => {
  const user = getCurrentUser();
  const mail = getCurrentUserMail(user);
  const now = new Date();

  return {
    createdAt: headerInfo?.createdAt || now,
    createdBy: headerInfo?.createdBy || user,
    filename: basename(document.fileName),
    author: `${user} <${mail}>`,
    updatedBy: user,
    updatedAt: now
  };
};

const insertHeaderHandler = (): void => {
  const activeTextEditor = window.activeTextEditor;
  
  if (!activeTextEditor) {
    window.showErrorMessage('No active text editor');
    return;
  }

  const { document } = activeTextEditor;

  if (!supportsLanguage(document.languageId)) {
    window.showInformationMessage(
      `No header support for language ${document.languageId}`
    );
    return;
  }

  activeTextEditor.edit(editor => {
    try {
      const currentHeader = extractHeader(document.getText(HEADER_RANGE));

      if (currentHeader) {
        editor.replace(
          HEADER_RANGE,
          renderHeader(
            document.languageId,
            newHeaderInfo(document, getHeaderInfo(currentHeader))
          )
        );
      } else {
        editor.insert(
          new Position(0, 0),
          renderHeader(
            document.languageId,
            newHeaderInfo(document)
          )
        );
      }
    } catch (error) {
      window.showErrorMessage(
        `Failed to insert header: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
};

const startUpdateOnSaveWatcher = (subscriptions: vscode.Disposable[]): void => {
  workspace.onWillSaveTextDocument(event => {
    const document = event.document;

    if (updatingDocuments.has(document.uri.toString())) {
      return;
    }

    if (!supportsLanguage(document.languageId)) {
      return;
    }

    const headerText = document.getText(HEADER_RANGE);
    const currentHeader = extractHeader(headerText);

    if (!currentHeader) {
      return;
    }

    try {
      const newHeader = renderHeader(
        document.languageId,
        newHeaderInfo(document, getHeaderInfo(currentHeader))
      );

      if (headerText === newHeader) {
        return;
      }

      event.waitUntil(Promise.resolve([
        TextEdit.replace(HEADER_RANGE, newHeader)
      ]));
    } catch (error) {
      console.error('Failed to update header on save:', error);
      event.waitUntil(Promise.resolve([]));
    }
  }, null, subscriptions);
};

const createStatusBarItem = (): vscode.StatusBarItem => {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  item.command = '42header.insertHeader';
  item.tooltip = 'Insert / update 42 Belgium header';
  return item;
};

const updateStatusBar = (item: vscode.StatusBarItem, editor?: vscode.TextEditor): void => {
  if (!editor || !supportsLanguage(editor.document.languageId)) {
    item.hide();
    return;
  }

  const header = extractHeader(editor.document.getText(HEADER_RANGE));
  if (header) {
    const info = getHeaderInfo(header);
    item.text = `$(account) ${info.author}`;
  } else {
    item.text = `$(file-add) Add 42 header`;
  }
  item.show();
};

const startAutoInsertOnNewFileWatcher = (subscriptions: vscode.Disposable[]): void => {
  workspace.onDidOpenTextDocument(async (document) => {
    if (!supportsLanguage(document.languageId)) {
      return;
    }

    if (document.isUntitled) {
      return;
    }

    if (document.getText(HEADER_RANGE).length > 0) {
      return;
    }

    const config = workspace.getConfiguration();
    if (!config.get<boolean>('42header.autoInsert')) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const editor = window.visibleTextEditors.find(
      e => e.document === document
    );

    if (!editor) {
      return;
    }

    await editor.edit(editBuilder => {
      editBuilder.insert(
        new Position(0, 0),
        renderHeader(document.languageId, newHeaderInfo(document))
      );
    });
  }, null, subscriptions);
};

const startRenameWatcher = (subscriptions: vscode.Disposable[]): void => {
  workspace.onDidRenameFiles(async (event) => {
    await Promise.all(event.files.map(async ({ newUri }) => {
      try {
        const document =
          workspace.textDocuments.find(d => d.uri.toString() === newUri.toString()) ??
          await workspace.openTextDocument(newUri);
        if (!supportsLanguage(document.languageId)) return;
        const headerText = document.getText(HEADER_RANGE);
        const header = extractHeader(headerText);
        if (!header) return;
        const newHeader = renderHeader(
          document.languageId,
          newHeaderInfo(document, getHeaderInfo(header))
        );
        if (headerText === newHeader) return;
        const edit = new vscode.WorkspaceEdit();
        edit.replace(newUri, HEADER_RANGE, newHeader);
        updatingDocuments.add(newUri.toString());
        try {
          const success = await vscode.workspace.applyEdit(edit);
          if (!success) {
            console.warn(`Edit failed for ${newUri.toString()}`);
            return;
          }
          await document.save();
        } finally {
          updatingDocuments.delete(newUri.toString());
        }
      } catch (err) {
        console.error(`Header update failed for ${newUri.toString()}`, err);
      }
    }));
  }, null, subscriptions);
};

export const activate = (context: ExtensionContext): void => {
  const disposable = vscode.commands.registerTextEditorCommand(
    '42header.insertHeader',
    insertHeaderHandler
  );
  context.subscriptions.push(disposable);

  startAutoInsertOnNewFileWatcher(context.subscriptions);

  const statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  updateStatusBar(statusBarItem, window.activeTextEditor);
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(editor => {
      updateStatusBar(statusBarItem, editor);
    })
  );

  startRenameWatcher(context.subscriptions);

  context.subscriptions.push(
    workspace.onDidChangeTextDocument(event => {
      if (
        window.activeTextEditor?.document === event.document &&
        event.contentChanges.some(change => change.range.start.line < HEADER_LINE_COUNT)
      ) {
        updateStatusBar(statusBarItem, window.activeTextEditor);
      }
    })
  );

  startUpdateOnSaveWatcher(context.subscriptions);
};

export const deactivate = (): void => {
};
