import {
  CodeAction,
  CodeActionContext,
  CodeActionProvider,
  Diagnostic,
  DocumentSelector,
  ExtensionContext,
  LanguageClient,
  languages,
  Range,
  TextDocument,
  workspace,
} from 'coc.nvim';

import { EXTENSION_NS } from '../constant';

type AdditionalDiagnostic = {
  codeDescription?: {
    href?: string;
  };
};

type MypyDiagnostic = Diagnostic & AdditionalDiagnostic;

type MypyRuleContents = {
  id: string | number;
  href: string;
};

export async function register(context: ExtensionContext, client: LanguageClient) {
  await client.onReady();

  if (!workspace.getConfiguration(EXTENSION_NS).get<boolean>('showDocumantaion.enable', true)) return;

  const documentSelector: DocumentSelector = [{ scheme: 'file', language: 'python' }];

  context.subscriptions.push(
    languages.registerCodeActionProvider(
      documentSelector,
      new ShowDocumentationCodeActionProvider(client),
      EXTENSION_NS
    )
  );
}

class ShowDocumentationCodeActionProvider implements CodeActionProvider {
  private readonly source = 'Mypy';
  private client: LanguageClient;

  constructor(client: LanguageClient) {
    this.client = client;
  }

  public async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext) {
    const doc = workspace.getDocument(document.uri);
    const wholeRange = Range.create(0, 0, doc.lineCount, 0);
    let whole = false;
    if (
      range.start.line === wholeRange.start.line &&
      range.start.character === wholeRange.start.character &&
      range.end.line === wholeRange.end.line &&
      range.end.character === wholeRange.end.character
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whole = true;
    }
    const codeActions: CodeAction[] = [];

    /** Show web documentation for [ruleId] */
    if (this.lineRange(range) && context.diagnostics.length > 0) {
      const line = doc.getline(range.start.line);
      if (line && line.length) {
        const mypyRuleContents: MypyRuleContents[] = [];
        context.diagnostics.forEach((d) => {
          if (d.source === this.source) {
            if ('codeDescription' in d) {
              const mypyDiagnostic = d as MypyDiagnostic;
              if (mypyDiagnostic.codeDescription?.href) {
                if (mypyDiagnostic.code) {
                  mypyRuleContents.push({
                    id: mypyDiagnostic.code,
                    href: mypyDiagnostic.codeDescription.href,
                  });
                }
              }
            }
          }
        });

        if (mypyRuleContents) {
          mypyRuleContents.forEach((r) => {
            const title = `Mypy (${r.id}): Show documentation [coc-mypy]`;

            const command = {
              title: '',
              command: 'vscode.open',
              arguments: [r.href],
            };

            const action: CodeAction = {
              title,
              command,
            };

            codeActions.push(action);
          });
        }
      }
    }

    return codeActions;
  }

  private lineRange(r: Range): boolean {
    return (
      (r.start.line + 1 === r.end.line && r.start.character === 0 && r.end.character === 0) ||
      (r.start.line === r.end.line && r.start.character === 0)
    );
  }
}
