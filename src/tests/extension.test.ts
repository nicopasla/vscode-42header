import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function waitForDocumentChange(
  doc: vscode.TextDocument,
  predicate: (text: string) => boolean,
  timeout = 3000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.dispose();
      reject(new Error(`waitForDocumentChange timed out after ${timeout}ms`));
    }, timeout);

    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === doc && predicate(e.document.getText())) {
        clearTimeout(timer);
        sub.dispose();
        resolve();
      }
    });

    if (predicate(doc.getText())) {
      clearTimeout(timer);
      sub.dispose();
      resolve();
    }
  });
}

function waitForSave(doc: vscode.TextDocument, timeout = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.dispose();
      reject(new Error(`waitForSave timed out after ${timeout}ms`));
    }, timeout);

    const sub = vscode.workspace.onDidSaveTextDocument(saved => {
      if (saved === doc) {
        clearTimeout(timer);
        sub.dispose();
        resolve();
      }
    });
  });
}

function waitForOpen(uri: vscode.Uri, timeout = 3000): Promise<vscode.TextDocument> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.dispose();
      reject(new Error(`waitForOpen timed out after ${timeout}ms`));
    }, timeout);

    const sub = vscode.workspace.onDidOpenTextDocument(opened => {
      if (opened.uri.fsPath === uri.fsPath) {
        clearTimeout(timer);
        sub.dispose();
        resolve(opened);
      }
    });
  });
}

async function closeAndDelete(filePath: string): Promise<void> {
  const uri = vscode.Uri.file(filePath);
  await vscode.window.tabGroups.close(
    vscode.window.tabGroups.all
      .flatMap(g => g.tabs)
      .filter(t => t.input instanceof vscode.TabInputText && t.input.uri.fsPath === uri.fsPath)
  );
  fs.unlinkSync(filePath);
}

suite('42 Belgium Header - Integration', () => {
  test('extension is active', async () => {
    const ext = vscode.extensions.getExtension('nicopasla.42belgiumheader');
    assert.ok(ext, 'Extension not found');
    await ext!.activate();
    assert.ok(ext!.isActive, 'Extension did not activate');
  });

  test('insertHeader command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('42header.insertHeader'));
  });

  test('insertHeader inserts header in a c file', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'c', content: '' });
    const editor = await vscode.window.showTextDocument(doc);

    const changed = waitForDocumentChange(doc, t => t.includes('Created:'));
    await vscode.commands.executeCommand('42header.insertHeader');
    await changed;

    const text = editor.document.getText();
    assert.ok(text.startsWith('/* '), 'Header does not start with /* ');
    assert.ok(text.includes('Created:'), 'Header missing Created field');
    assert.ok(text.includes('Updated:'), 'Header missing Updated field');
  });

  test('save updates updatedAt but preserves createdAt', async () => {
    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    const editor = await vscode.window.showTextDocument(doc);

    const inserted = waitForDocumentChange(doc, t => t.includes('Created:'));
    await vscode.commands.executeCommand('42header.insertHeader');
    await inserted;

    const firstText = editor.document.getText();
    const createdAt = firstText.match(/Created: (\S+ \S+)/)![1];
    const updatedAt = firstText.match(/Updated: (\S+ \S+)/)![1];

    await new Promise(r => setTimeout(r, 1100));

    const updated = waitForDocumentChange(doc, t => {
      const m = t.match(/Updated: (\S+ \S+)/);
      return !!m && m[1] !== updatedAt;
    });
    const saved = waitForSave(doc);
    await doc.save();
    await Promise.all([saved, updated]);

    const secondText = editor.document.getText();
    assert.strictEqual(secondText.match(/Created: (\S+ \S+)/)![1], createdAt, 'createdAt changed');
    assert.notStrictEqual(secondText.match(/Updated: (\S+ \S+)/)![1], updatedAt, 'updatedAt did not change');

    await closeAndDelete(tmpPath);
  });

  test('insertHeader does nothing on unsupported language', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'xml', content: 'hello' });
    await vscode.window.showTextDocument(doc);

    let changed = false;
    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === doc) changed = true;
    });

    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(r => setTimeout(r, 300));
    sub.dispose();

    assert.strictEqual(doc.getText(), 'hello', 'Content should be unchanged');
    assert.ok(!changed, 'Document was unexpectedly modified');
  });

  test('inserting header twice does not duplicate it', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'c', content: '' });
    await vscode.window.showTextDocument(doc);

    const first = waitForDocumentChange(doc, t => t.includes('Created:'));
    await vscode.commands.executeCommand('42header.insertHeader');
    await first;

    let changeCount = 0;
    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === doc) changeCount++;
    });
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(r => setTimeout(r, 300));
    sub.dispose();

    const count = (doc.getText().match(/Created:/g) || []).length;
    assert.strictEqual(count, 1, 'Header was duplicated');
  });

  test('insertHeader works for python files', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'python', content: '' });
    const editor = await vscode.window.showTextDocument(doc);

    const changed = waitForDocumentChange(doc, t => t.startsWith('# '));
    await vscode.commands.executeCommand('42header.insertHeader');
    await changed;

    assert.ok(editor.document.getText().startsWith('# '), 'Python header should start with # ');
  });

  test('auto-insert inserts header on new empty file when enabled', async () => {
    await vscode.workspace.getConfiguration().update('42header.autoInsert', true, vscode.ConfigurationTarget.Global);

    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');
    const uri = vscode.Uri.file(tmpPath);

    const doc = await vscode.workspace.openTextDocument(uri);
    const changed = waitForDocumentChange(doc, t => t.startsWith('/* '));
    await vscode.window.showTextDocument(doc);
    await changed;

    assert.ok(doc.getText().startsWith('/* '), 'Auto-insert did not add header');

    await vscode.workspace.getConfiguration().update('42header.autoInsert', false, vscode.ConfigurationTarget.Global);
    await closeAndDelete(tmpPath);
  });

  test('auto-insert does not insert header when disabled', async () => {
    await vscode.workspace.getConfiguration().update('42header.autoInsert', false, vscode.ConfigurationTarget.Global);

    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    let changed = false;
    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === doc) changed = true;
    });
    await vscode.window.showTextDocument(doc);
    await new Promise(r => setTimeout(r, 300));
    sub.dispose();

    assert.strictEqual(doc.getText(), '', 'Auto-insert added header when disabled');
    assert.ok(!changed, 'Document was unexpectedly modified');

    await closeAndDelete(tmpPath);
  });

  test('auto-insert does not overwrite existing content', async () => {
    await vscode.workspace.getConfiguration().update('42header.autoInsert', true, vscode.ConfigurationTarget.Global);

    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, 'int main() {}');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    let changed = false;
    const sub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === doc) changed = true;
    });
    await vscode.window.showTextDocument(doc);
    await new Promise(r => setTimeout(r, 300));
    sub.dispose();

    assert.ok(doc.getText().startsWith('int main()'), 'Auto-insert overwrote existing content');
    assert.ok(!changed, 'Document was unexpectedly modified');

    await vscode.workspace.getConfiguration().update('42header.autoInsert', false, vscode.ConfigurationTarget.Global);
    await closeAndDelete(tmpPath);
  });

  test('header filename matches actual filename', async () => {
    const tmpPath = path.join(os.tmpdir(), `myfile-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    const editor = await vscode.window.showTextDocument(doc);

    const filename = path.basename(tmpPath);
    const changed = waitForDocumentChange(doc, t => t.includes(filename));
    await vscode.commands.executeCommand('42header.insertHeader');
    await changed;

    assert.ok(editor.document.getText().includes(filename), `Header does not contain filename ${filename}`);

    await closeAndDelete(tmpPath);
  });

  test('header is updated after manual edit and save', async () => {
    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    const editor = await vscode.window.showTextDocument(doc);

    const inserted = waitForDocumentChange(doc, t => t.includes('Created:'));
    await vscode.commands.executeCommand('42header.insertHeader');
    await inserted;

    await editor.edit(eb => {
      const end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
      eb.insert(end, '\nint main() {}');
    });

    await new Promise(r => setTimeout(r, 1100));

    const saved = waitForSave(doc);
    await doc.save();
    await saved;

    const text = editor.document.getText();
    assert.ok(text.includes('Updated:'), 'Header missing after save with content');
    assert.ok(text.includes('int main()'), 'Content was lost after save');

    await closeAndDelete(tmpPath);
  });

  test('header filename updates after file rename', async () => {
    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    const newPath = tmpPath.replace('.c', '-renamed.c');
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    await vscode.window.showTextDocument(doc);

    const inserted = waitForDocumentChange(doc, t => t.includes('Created:'));
    await vscode.commands.executeCommand('42header.insertHeader');
    await inserted;

    const newUri = vscode.Uri.file(newPath);
    const opened = waitForOpen(newUri);

    const edit = new vscode.WorkspaceEdit();
    edit.renameFile(vscode.Uri.file(tmpPath), newUri);
    await vscode.workspace.applyEdit(edit);

    const newDoc = await opened;
    const newFilename = path.basename(newPath);

    await waitForDocumentChange(newDoc, t => t.includes(newFilename));

    assert.ok(newDoc.getText().includes(newFilename), `Header filename not updated after rename, expected ${newFilename}`);

    fs.unlinkSync(newPath);
  });

});