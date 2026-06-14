declare const __dirname: string;

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const featuresRoot = path.join(repoRoot, 'src/features');

const allowedFiles = new Set<string>();

const disallowedPatterns = [
  /@shared\/osc\/OscClient/,
  /@shared\/osc\/X32Protocol/,
  /@shared\/network\/UdpTransport/,
  /@shared\/console\/adapters\//,
];

const walk = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry: any) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });

describe('console adapter boundary', () => {
  it('keeps feature code from importing protocol and adapter internals directly', () => {
    const offenders = walk(featuresRoot).filter((filePath) => {
      if (allowedFiles.has(filePath)) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return disallowedPatterns.some((pattern) => pattern.test(content));
    });

    expect(offenders.map((filePath) => path.relative(repoRoot, filePath))).toEqual([]);
  });
});

export {};
