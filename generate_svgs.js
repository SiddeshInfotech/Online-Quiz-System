import fs from 'fs';
import path from 'path';
import { 
  SiPython, SiC, SiCplusplus,
  SiJavascript, SiTypescript, SiHtml5, 
  SiReact, SiAngular, SiVuedotjs, SiNodedotjs, 
  SiExpress, SiDjango, SiFlask, SiPhp, SiLaravel, 
  SiGo, SiRust, SiKotlin, SiSwift, SiRuby, 
  SiMongodb, SiPostgresql, SiMysql 
} from "react-icons/si";
import { FaDatabase, FaJava, FaCss3 } from "react-icons/fa";
import { TbBrandCSharp } from "react-icons/tb";

const LOGOS = {
  "python.svg":      { icon: SiPython, color: "#3776AB" },
  "java.svg":        { icon: FaJava, color: "#007396" },
  "javascript.svg":  { icon: SiJavascript, color: "#F7DF1E" },
  "typescript.svg":  { icon: SiTypescript, color: "#3178C6" },
  "html5.svg":       { icon: SiHtml5, color: "#E34F26" },
  "css3.svg":        { icon: FaCss3, color: "#1572B6" },
  "react.svg":       { icon: SiReact, color: "#61DAFB" },
  "angular.svg":     { icon: SiAngular, color: "#DD0031" },
  "vue.svg":         { icon: SiVuedotjs, color: "#4FC08D" },
  "nodejs.svg":      { icon: SiNodedotjs, color: "#339933" },
  "express.svg":     { icon: SiExpress, color: "#000000" },
  "django.svg":      { icon: SiDjango, color: "#092E20" },
  "flask.svg":       { icon: SiFlask, color: "#000000" },
  "php.svg":         { icon: SiPhp, color: "#777BB4" },
  "laravel.svg":     { icon: SiLaravel, color: "#FF2D20" },
  "go.svg":          { icon: SiGo, color: "#00ADD8" },
  "rust.svg":        { icon: SiRust, color: "#000000" },
  "kotlin.svg":      { icon: SiKotlin, color: "#7F52FF" },
  "swift.svg":       { icon: SiSwift, color: "#F05138" },
  "ruby.svg":        { icon: SiRuby, color: "#CC342D" },
  "cplusplus.svg":   { icon: SiCplusplus, color: "#00599C" },
  "csharp.svg":      { icon: TbBrandCSharp, color: "#239120" },
  "c.svg":           { icon: SiC, color: "#A8B9CC" },
  "mongodb.svg":     { icon: SiMongodb, color: "#47A248" },
  "postgresql.svg":  { icon: SiPostgresql, color: "#336791" },
  "mysql.svg":       { icon: SiMysql, color: "#4479A1" },
  "sql.svg":         { icon: FaDatabase, color: "#003B57" }
};

const extractSvg = (iconFunc, color) => {
  const el = iconFunc({});
  // React elements from react-icons are structured as:
  // { props: { children: [ { props: { d: "..." } } ], viewBox: "0 0 24 24" } }
  
  let paths = [];
  const extractPaths = (children) => {
    if (!children) return;
    const kids = Array.isArray(children) ? children : [children];
    kids.forEach(k => {
      if (k && k.type === 'path' && k.props && k.props.d) {
        paths.push(`<path fill="${color}" d="${k.props.d}" />`);
      } else if (k && k.props && k.props.children) {
        extractPaths(k.props.children);
      }
    });
  };
  
  extractPaths(el.props.children);
  
  // Tabler icons use a stroke instead of fill
  if (paths.length === 0) {
    const extractStrokes = (children) => {
      if (!children) return;
      const kids = Array.isArray(children) ? children : [children];
      kids.forEach(k => {
        if (k && k.type === 'path' && k.props && k.props.d) {
          paths.push(`<path fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="${k.props.d}" />`);
        } else if (k && k.props && k.props.children) {
          extractStrokes(k.props.children);
        }
      });
    };
    extractStrokes(el.props.children);
  }

  const viewBox = el.props.viewBox || "0 0 24 24";
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">${paths.join('')}</svg>`;
};

for (const [filename, { icon, color }] of Object.entries(LOGOS)) {
  const svgContent = extractSvg(icon, color);
  fs.writeFileSync(path.join('src/assets/languages', filename), svgContent);
  console.log(`Generated ${filename}`);
}
