const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'frontend', 'src');

const componentMapping = {
    'Button': 'BaseUI',
    'Input': 'BaseUI',
    'Card': 'BaseUI',
    'Counter': 'BaseUI',
    'GlassSurface': 'Aesthetics',
    'BorderGlow': 'Aesthetics',
    'DecryptedText': 'Aesthetics',
    'GlobalLoadingScreen': 'Loaders',
    'PageLoader': 'Loaders'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const uiDir = path.join(srcDir, 'components', 'ui');

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Find all imports from ../ui/Component or similar
    // This is a bit complex due to varying relative paths
    
    // Match: import Component from '.../ui/Component'
    // Also handle { Component } if already using that
    
    Object.keys(componentMapping).forEach(comp => {
        const targetModule = componentMapping[comp];
        
        // Pattern 1: import Button from '../ui/Button'
        const regex1 = new RegExp(`import\\s+${comp}\\s+from\\s+'([^']+\\/ui\\/)${comp}'`, 'g');
        content = content.replace(regex1, (match, p1) => {
            return `import { ${comp} } from '${p1}${targetModule}'`;
        });
        
        // Pattern 2: import Button from "../ui/Button"
        const regex2 = new RegExp(`import\\s+${comp}\\s+from\\s+"([^"]+\\/ui\\/)${comp}"`, 'g');
        content = content.replace(regex2, (match, p1) => {
            return `import { ${comp} } from "${p1}${targetModule}"`;
        });
    });

    // Post-process: merging multiple imports from same file
    // e.g. import { Button } from '../ui/BaseUI' and import { Card } from '../ui/BaseUI'
    // into import { Button, Card } from '../ui/BaseUI'
    
    ['BaseUI', 'Aesthetics', 'Loaders'].forEach(mod => {
        const modRegex = new RegExp(`import\\s+{(.*)}\\s+from\\s+'([^']+\\/ui\\/)${mod}'`, 'g');
        const imports = {};
        
        let match;
        while ((match = modRegex.exec(content)) !== null) {
            const pathKey = match[2] + mod;
            if (!imports[pathKey]) imports[pathKey] = new Set();
            match[1].split(',').forEach(s => imports[pathKey].add(s.trim()));
        }
        
        Object.keys(imports).forEach(p => {
            const joined = Array.from(imports[p]).join(', ');
            const escapedPath = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const replaceRegex = new RegExp(`import\\s+{(.*)}\\s+from\\s+'${escapedPath}'`, 'g');
            
            let first = true;
            content = content.replace(replaceRegex, (m) => {
                if (first) {
                    first = false;
                    return `import { ${joined} } from '${p}'`;
                }
                return ''; // Remove subsequent ones
            });
        });
        
        // Clean up empty lines left by removal
        content = content.replace(/^\s*[\r\n]/gm, (m, offset) => {
            // Check if previous line was an import we replaced with empty
            return m; 
        });
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
});
