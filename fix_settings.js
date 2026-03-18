const fs = require('fs');
const path = require('path');

const dirs = [
    'c:/Users/asus/CSE 471 Project/frontend/src/components/settings',
    'c:/Users/asus/CSE 471 Project/frontend/src/pages'
];

const replacements = [
    { regex: /bg-white\/\[0\.(02|025|03|05|07)\]/g, replacement: 'bg-surface' },
    { regex: /bg-white\/5(?![0-9])/g, replacement: 'bg-surface' },
    { regex: /bg-black\/10/g, replacement: 'bg-sunken' },
    { regex: /bg-white\/10/g, replacement: 'bg-elevated' },
    { regex: /border-white\/5/g, replacement: 'border-default' },
    { regex: /border-white\/10/g, replacement: 'border-strong' },
    { regex: /border-white\/15/g, replacement: 'border-strong' },
    { regex: /text-white\/1[05]/g, replacement: 'text-disabled' },
    { regex: /text-white\/2[05]/g, replacement: 'text-tertiary' },
    { regex: /text-white\/30/g, replacement: 'text-tertiary' },
    { regex: /text-white\/40/g, replacement: 'text-secondary' },
    { regex: /text-white\/50/g, replacement: 'text-secondary' },
    { regex: /text-emerald-400\/60/g, replacement: 'text-emerald-400' },
    { regex: /text-white(?!\/|\]|-)/g, replacement: 'text-primary' },
    { regex: /bg-white(?!\/|\]|-)/g, replacement: 'bg-elevated' }
];

dirs.forEach(dir => {
    fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.jsx')) {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            
            replacements.forEach(({ regex, replacement }) => {
                content = content.replace(regex, replacement);
            });
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content);
                console.log(`Updated ${file}`);
            }
        }
    });
});
console.log('Done refactoring!');
