import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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
    const doc = await vscode.workspace.openTextDocument({
      language: 'c',
      content: ''
    });
    const editor = await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(resolve => setTimeout(resolve, 500));

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

  await vscode.commands.executeCommand('42header.insertHeader');
  await new Promise(resolve => setTimeout(resolve, 500));

  const firstText = editor.document.getText();
  const createdAtMatch = firstText.match(/Created: (\S+ \S+)/);
  const updatedAtMatch = firstText.match(/Updated: (\S+ \S+)/);

  await new Promise(resolve => setTimeout(resolve, 1000));
  await doc.save();
  await new Promise(resolve => setTimeout(resolve, 500));

  const secondText = editor.document.getText();
  const newCreatedAtMatch = secondText.match(/Created: (\S+ \S+)/);
  const newUpdatedAtMatch = secondText.match(/Updated: (\S+ \S+)/);

  assert.strictEqual(createdAtMatch![1], newCreatedAtMatch![1], 'createdAt changed');
  assert.notStrictEqual(updatedAtMatch![1], newUpdatedAtMatch![1], 'updatedAt did not change');
  fs.unlinkSync(tmpPath);
});

  test('insertHeader does nothing on unsupported language', async () => {
  const doc = await vscode.workspace.openTextDocument({
    language: 'xml',
    content: 'hello'
  });
  await vscode.window.showTextDocument(doc);
  await vscode.commands.executeCommand('42header.insertHeader');
  await new Promise(resolve => setTimeout(resolve, 500));

  const text = doc.getText();
  assert.strictEqual(text, 'hello', 'Content should be unchanged');
  });

  test('inserting header twice does not duplicate it', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'c',
      content: ''
    });
    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(resolve => setTimeout(resolve, 500));
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = doc.getText();
    const count = (text.match(/Created:/g) || []).length;
    assert.strictEqual(count, 1, 'Header was duplicated');
  });

  test('insertHeader works for python files', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'python',
      content: ''
    });
    const editor = await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = editor.document.getText();
    assert.ok(text.startsWith('# '), 'Python header should start with # ');
  });

  test('auto-insert inserts header on new empty file when enabled', async () => {
    await vscode.workspace.getConfiguration().update(
      '42header.autoInsert',
      true,
      vscode.ConfigurationTarget.Global
    );

    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    await vscode.window.showTextDocument(doc);
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = doc.getText();
    assert.ok(text.startsWith('/* '), 'Auto-insert did not add header');

    await vscode.workspace.getConfiguration().update(
      '42header.autoInsert',
      false,
      vscode.ConfigurationTarget.Global
    );
    fs.unlinkSync(tmpPath);
  });

  test('auto-insert does not insert header when disabled', async () => {
    await vscode.workspace.getConfiguration().update(
      '42header.autoInsert',
      false,
      vscode.ConfigurationTarget.Global
    );

    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    await vscode.window.showTextDocument(doc);
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = doc.getText();
    assert.strictEqual(text, '', 'Auto-insert added header when disabled');

    fs.unlinkSync(tmpPath);
  });

  test('auto-insert does not overwrite existing content', async () => {
    await vscode.workspace.getConfiguration().update(
      '42header.autoInsert',
      true,
      vscode.ConfigurationTarget.Global
    );

    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, 'int main() {}');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    await vscode.window.showTextDocument(doc);
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = doc.getText();
    assert.ok(text.startsWith('int main()'), 'Auto-insert overwrote existing content');

    await vscode.workspace.getConfiguration().update(
      '42header.autoInsert',
      false,
      vscode.ConfigurationTarget.Global
    );
    fs.unlinkSync(tmpPath);
  });

  test('header filename matches actual filename', async () => {
    const tmpPath = path.join(os.tmpdir(), `myfile-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    const editor = await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = editor.document.getText();
    const filename = path.basename(tmpPath);
    assert.ok(text.includes(filename), `Header does not contain filename ${filename}`);

    fs.unlinkSync(tmpPath);
  });

  test('header is updated after manual edit and save', async () => {
    const tmpPath = path.join(os.tmpdir(), `test-${Date.now()}.c`);
    fs.writeFileSync(tmpPath, '');

    const doc = await vscode.workspace.openTextDocument(tmpPath);
    const editor = await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('42header.insertHeader');
    await new Promise(resolve => setTimeout(resolve, 500));

    await editor.edit(editBuilder => {
      const end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
      editBuilder.insert(end, '\nint main() {}');
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    await doc.save();
    await new Promise(resolve => setTimeout(resolve, 500));

    const text = editor.document.getText();
    assert.ok(text.includes('Updated:'), 'Header missing after save with content');
    assert.ok(text.includes('int main()'), 'Content was lost after save');

    fs.unlinkSync(tmpPath);
  });
});