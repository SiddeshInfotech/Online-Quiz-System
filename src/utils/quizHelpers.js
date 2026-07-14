const subjectMap = {
  python: {
    bg: ["#3776AB", "#2B5B84"],
    icon: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#FFD43B"/>`
  },
  javascript: {
    bg: ["#F7DF1E", "#D4B800"],
    color: "#000000"
  },
  js: {
    bg: ["#F7DF1E", "#D4B800"],
    color: "#000000"
  },
  react: {
    bg: ["#20232A", "#282C34"],
    color: "#61DAFB",
    icon: `<circle cx="12" cy="12" r="2" fill="#61DAFB"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" fill="none" stroke="#61DAFB" stroke-width="1"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" fill="none" stroke="#61DAFB" stroke-width="1"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(150 12 12)" fill="none" stroke="#61DAFB" stroke-width="1"/>`
  },
  java: {
    bg: ["#f89820", "#e76f00"],
    color: "#ffffff"
  },
  html: {
    bg: ["#E34F26", "#C73812"],
  },
  css: {
    bg: ["#1572B6", "#0E5A91"],
  },
  "node.js": {
    bg: ["#339933", "#257025"],
  },
  node: {
    bg: ["#339933", "#257025"],
  },
  django: {
    bg: ["#092E20", "#061F15"],
    color: "#ffffff"
  },
  sql: {
    bg: ["#00758F", "#00566A"],
  },
  mongodb: {
    bg: ["#47A248", "#337634"],
  },
  git: {
    bg: ["#F05032", "#C93719"],
  },
  "c++": {
    bg: ["#00599C", "#004070"],
  },
  c: {
    bg: ["#A8B9CC", "#7C95AE"],
    color: "#00599C"
  }
};

export const getDynamicQuizTitle = (title, subject, topic) => {
  const genericTitles = ["Untitled Quiz", "New Quiz", "AI Generated Quiz", "Quiz"];
  const t = title ? title.trim() : "";
  if (!t || genericTitles.includes(t)) {
    if (topic && subject) return `${subject}: ${topic}`;
    if (topic) return topic;
    if (subject) return `${subject} Fundamentals`;
    return "Programming Assessment";
  }
  return t;
};

export const getSubjectThumbnail = (subject) => {
  const fallbackBg = ["#6366f1", "#4f46e5"];
  const fallbackColor = "#ffffff";
  let bg = fallbackBg;
  let color = fallbackColor;
  let iconPath = `<path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" fill="currentColor"/>`;
  let displaySubject = subject || "Code";

  if (subject) {
    const key = subject.toLowerCase().trim();
    for (const [k, v] of Object.entries(subjectMap)) {
      if (key.includes(k) || k === key) {
        bg = v.bg;
        color = v.color || "#ffffff";
        if (v.icon) iconPath = v.icon;
        else {
          iconPath = `<polyline points="16 18 22 12 16 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8 6 2 12 8 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        break;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bg[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${bg[1]};stop-opacity:1" />
      </linearGradient>
      <pattern id="pattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="${color}" opacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <rect width="100%" height="100%" fill="url(#pattern)" />
    
    <g transform="translate(200, 90)">
      <svg x="-24" y="-40" width="48" height="48" viewBox="0 0 24 24" color="${color}">
        ${iconPath}
      </svg>
      <text x="0" y="30" fill="${color}" font-size="28" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="1">${displaySubject.toUpperCase()}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const enrichQuiz = (quiz) => {
  if (!quiz) return quiz;
  const genericPlaceholders = ["placeholder", "unsplash", "ui-avatars", "default"];

  let useDynamicThumbnail = true;
  if (quiz.thumbnail) {
    if (!genericPlaceholders.some(p => quiz.thumbnail.toLowerCase().includes(p))) {
      useDynamicThumbnail = false;
    }
  }

  return {
    ...quiz,
    title: getDynamicQuizTitle(quiz.title || quiz.quiz_title, quiz.subject || quiz.category, quiz.topic),
    thumbnail: useDynamicThumbnail ? getSubjectThumbnail(quiz.subject || quiz.category || quiz.topic) : quiz.thumbnail,
  };
};
