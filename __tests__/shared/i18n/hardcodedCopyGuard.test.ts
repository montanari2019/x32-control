declare const __dirname: string;

const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '../../../src');
const resourcesRoot = path.resolve(sourceRoot, 'shared/i18n/resources');

const sourceExtensions = new Set(['.ts', '.tsx']);
const forbiddenLegacyCopy = [
  'Buscar mesas na rede',
  'Bus disponíveis',
  'Carregando canais',
  'Tentando novamente',
  'Mesa disponível',
  'Nenhuma mesa encontrada',
  'Falha na descoberta',
  'Falha ao carregar',
  'Falha ao salvar',
  'Erro inesperado',
  'Canal vinculado',
  'Editar PAN',
  'Desenvolvido por',
  'Versão',
  'Restaurando Preset',
];

const walkSourceFiles = (directory: string): string[] => {
  const entries: Array<{ name: string; isDirectory: () => boolean }> = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (fullPath.startsWith(resourcesRoot)) {
      return [];
    }

    if (entry.isDirectory()) {
      return walkSourceFiles(fullPath);
    }

    return sourceExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
};

describe('hardcoded copy guard', () => {
  it('keeps legacy Portuguese UI copy inside translation resources', () => {
    const offenders = walkSourceFiles(sourceRoot).flatMap((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');

      return forbiddenLegacyCopy
        .filter((copy) => content.includes(copy))
        .map((copy) => `${path.relative(sourceRoot, filePath)}: ${copy}`);
    });

    expect(offenders).toEqual([]);
  });
});
