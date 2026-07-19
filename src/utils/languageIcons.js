import React from "react";
import { Code } from "lucide-react";

// Import all official SVG logos
import pythonLogo from "../assets/languages/python.svg";
import javaLogo from "../assets/languages/java.svg";
import javascriptLogo from "../assets/languages/javascript.svg";
import typescriptLogo from "../assets/languages/typescript.svg";
import reactLogo from "../assets/languages/react.svg";
import nodejsLogo from "../assets/languages/nodejs.svg";
import html5Logo from "../assets/languages/html5.svg";
import css3Logo from "../assets/languages/css3.svg";
import cplusplusLogo from "../assets/languages/cplusplus.svg";
import csharpLogo from "../assets/languages/csharp.svg";
import cLogo from "../assets/languages/c.svg";
import goLogo from "../assets/languages/go.svg";
import rustLogo from "../assets/languages/rust.svg";
import phpLogo from "../assets/languages/php.svg";
import laravelLogo from "../assets/languages/laravel.svg";
import djangoLogo from "../assets/languages/django.svg";
import flaskLogo from "../assets/languages/flask.svg";
import sqlLogo from "../assets/languages/sql.svg";
import angularLogo from "../assets/languages/angular.svg";
import vueLogo from "../assets/languages/vue.svg";
import expressLogo from "../assets/languages/express.svg";
import kotlinLogo from "../assets/languages/kotlin.svg";
import swiftLogo from "../assets/languages/swift.svg";
import rubyLogo from "../assets/languages/ruby.svg";
import mongodbLogo from "../assets/languages/mongodb.svg";
import postgresqlLogo from "../assets/languages/postgresql.svg";
import mysqlLogo from "../assets/languages/mysql.svg";

/**
 * Creates a stable React component that renders an <img> tag for the given SVG logo.
 */
const createLogoComponent = (src, displayName) => {
  const LogoComponent = ({ size = 24, className = "" }) => React.createElement("img", {
    src: src,
    alt: displayName,
    width: size,
    height: size,
    className: `inline-block object-contain ${className}`,
    style: { width: size, height: size },
    draggable: false
  });
  LogoComponent.displayName = `${displayName}Logo`;
  return LogoComponent;
};

/**
 * FallbackIcon — wraps the lucide Code icon for unknown languages.
 */
const FallbackIcon = ({ size = 24, color = "#6366f1", className = "" }) => React.createElement(Code, {
  size: size,
  color: color,
  className: className
});
FallbackIcon.displayName = "FallbackCodeIcon";

/**
 * Pre-built logo component map.
 * Each entry has: { icon: ReactComponent, color: string, name: string }
 */
const LOGO_MAP = {
  "python":       { icon: createLogoComponent(pythonLogo, "Python"),           color: "#3776AB",  name: "Python" },
  "java":         { icon: createLogoComponent(javaLogo, "Java"),               color: "#E76F00",  name: "Java" },
  "javascript":   { icon: createLogoComponent(javascriptLogo, "JavaScript"),   color: "#F7DF1E",  name: "JavaScript" },
  "typescript":   { icon: createLogoComponent(typescriptLogo, "TypeScript"),   color: "#3178C6",  name: "TypeScript" },
  "html":         { icon: createLogoComponent(html5Logo, "HTML5"),             color: "#E34F26",  name: "HTML" },
  "html5":        { icon: createLogoComponent(html5Logo, "HTML5"),             color: "#E34F26",  name: "HTML5" },
  "css":          { icon: createLogoComponent(css3Logo, "CSS3"),               color: "#1572B6",  name: "CSS" },
  "css3":         { icon: createLogoComponent(css3Logo, "CSS3"),               color: "#1572B6",  name: "CSS3" },
  "react":        { icon: createLogoComponent(reactLogo, "React"),             color: "#61DAFB",  name: "React" },
  "angular":      { icon: createLogoComponent(angularLogo, "Angular"),         color: "#DD0031",  name: "Angular" },
  "vue":          { icon: createLogoComponent(vueLogo, "Vue"),                 color: "#4FC08D",  name: "Vue" },
  "vue.js":       { icon: createLogoComponent(vueLogo, "Vue.js"),              color: "#4FC08D",  name: "Vue.js" },
  "node.js":      { icon: createLogoComponent(nodejsLogo, "Node.js"),          color: "#339933",  name: "Node.js" },
  "nodejs":       { icon: createLogoComponent(nodejsLogo, "Node.js"),          color: "#339933",  name: "Node.js" },
  "express":      { icon: createLogoComponent(expressLogo, "Express"),         color: "#000000",  name: "Express" },
  "express.js":   { icon: createLogoComponent(expressLogo, "Express.js"),      color: "#000000",  name: "Express.js" },
  "django":       { icon: createLogoComponent(djangoLogo, "Django"),           color: "#092E20",  name: "Django" },
  "flask":        { icon: createLogoComponent(flaskLogo, "Flask"),             color: "#000000",  name: "Flask" },
  "php":          { icon: createLogoComponent(phpLogo, "PHP"),                 color: "#777BB4",  name: "PHP" },
  "laravel":      { icon: createLogoComponent(laravelLogo, "Laravel"),         color: "#FF2D20",  name: "Laravel" },
  "go":           { icon: createLogoComponent(goLogo, "Go"),                   color: "#00ADD8",  name: "Go" },
  "golang":       { icon: createLogoComponent(goLogo, "Go"),                   color: "#00ADD8",  name: "Go" },
  "rust":         { icon: createLogoComponent(rustLogo, "Rust"),               color: "#000000",  name: "Rust" },
  "kotlin":       { icon: createLogoComponent(kotlinLogo, "Kotlin"),           color: "#7F52FF",  name: "Kotlin" },
  "swift":        { icon: createLogoComponent(swiftLogo, "Swift"),             color: "#F05138",  name: "Swift" },
  "ruby":         { icon: createLogoComponent(rubyLogo, "Ruby"),               color: "#CC342D",  name: "Ruby" },
  "c++":          { icon: createLogoComponent(cplusplusLogo, "C++"),           color: "#00599C",  name: "C++" },
  "c#":           { icon: createLogoComponent(csharpLogo, "C#"),               color: "#68217A",  name: "C#" },
  "c":            { icon: createLogoComponent(cLogo, "C"),                     color: "#A8B9CC",  name: "C" },
  "mongodb":      { icon: createLogoComponent(mongodbLogo, "MongoDB"),         color: "#47A248",  name: "MongoDB" },
  "postgresql":   { icon: createLogoComponent(postgresqlLogo, "PostgreSQL"),   color: "#336791",  name: "PostgreSQL" },
  "postgres":     { icon: createLogoComponent(postgresqlLogo, "PostgreSQL"),   color: "#336791",  name: "PostgreSQL" },
  "mysql":        { icon: createLogoComponent(mysqlLogo, "MySQL"),             color: "#4479A1",  name: "MySQL" },
  "sql":          { icon: createLogoComponent(sqlLogo, "SQL"),                 color: "#003B57",  name: "SQL" },
};

const FALLBACK = { icon: FallbackIcon, color: "#6366f1", name: "Code" };

/**
 * getLanguageIcon(subject)
 *
 * Primary input: quiz.subject (provided by the backend)
 * Returns: { icon: Component, color: string, name: string }
 *
 * - If subject matches a known language → returns the official SVG logo as an <img> component
 * - If subject is unknown → returns the generic Code icon from lucide-react
 *
 * The returned `icon` component accepts: size, className
 */
export const getLanguageIcon = (subject) => {
  if (!subject || typeof subject !== "string") {
    return FALLBACK;
  }

  const key = subject.trim().toLowerCase();
  return LOGO_MAP[key] || { icon: FallbackIcon, color: "#6366f1", name: subject };
};
