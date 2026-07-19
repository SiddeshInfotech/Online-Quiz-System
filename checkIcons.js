const fs = require('fs');

const packages = ['si', 'fa', 'tb', 'pi', 'di', 'io5'];
const languages = ['Python', 'Java', 'C', 'Cplusplus', 'Csharp', 'Javascript', 'Typescript', 'Html5', 'Css3', 'React', 'Angular', 'Vuedotjs', 'Vue', 'Nodedotjs', 'Node', 'Express', 'Django', 'Flask', 'Php', 'Laravel', 'Go', 'Rust', 'Kotlin', 'Swift', 'Ruby', 'Mongodb', 'Postgresql', 'Mysql', 'Database'];

let out = '';

for (const pkg of packages) {
  try {
    const mod = require(`react-icons/${pkg}`);
    const keys = Object.keys(mod);
    out += `\n--- Package: ${pkg} ---\n`;
    for (const lang of languages) {
      // Find matching keys case-insensitively
      const matches = keys.filter(k => k.toLowerCase().includes(lang.toLowerCase()) || k.toLowerCase().includes(lang.toLowerCase().replace('dotjs', 'js')));
      if (matches.length > 0) {
        out += `${lang}: ${matches.join(', ')}\n`;
      }
    }
  } catch (e) {
    out += `Error loading ${pkg}: ${e.message}\n`;
  }
}

fs.writeFileSync('icon-check.txt', out);
