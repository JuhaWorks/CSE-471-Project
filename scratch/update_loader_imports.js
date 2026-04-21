const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'frontend', 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Pattern: import { Skeleton } from '../ui/PremiumLoaders'
    // Also handle varying relative paths
    
    const regex = /import\s+{(.*)}\s+from\s+['"]([^'"]+\/ui\/)PremiumLoaders['"]/g;
    content = content.replace(regex, (match, comps, p1) => {
        return `import { ${comps} } from '${p1}Loaders'`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
});
