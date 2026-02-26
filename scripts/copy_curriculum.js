const fs = require('fs');
const path = require('path');

function replaceDirSync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            replaceDirSync(srcPath, destPath);
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            let content = fs.readFileSync(srcPath, 'utf8');
            content = content.replace(/useFirestore/g, 'useUsersFirestore');
            content = content.replace(/\/a\/curriculum/g, '/f/learning');
            content = content.replace(/\/a\/classes/g, '/f/classes'); // Just in case
            fs.writeFileSync(destPath, content, 'utf8');
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const root = path.join(__dirname, '..');

// Copy new directory
replaceDirSync(
    path.join(root, 'src', 'app', 'admin', 'curriculum', 'new'),
    path.join(root, 'src', 'app', 'staff', 'learning', 'new')
);

// Copy [id] directory
replaceDirSync(
    path.join(root, 'src', 'app', 'admin', 'curriculum', '[id]'),
    path.join(root, 'src', 'app', 'staff', 'learning', '[id]')
);

console.log('Copied and replaced admin/curriculum into staff/learning!');
