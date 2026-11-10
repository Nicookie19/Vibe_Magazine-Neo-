const stopWords = new Set(
  "a an and are as at be but by can do does for from get give have help how i in is it me my of on or our please tell that the this to us was we what when where which who why with you your about website site page".split(" "),
);

const aliases = {
  magazines: "magazine", issues: "magazine", editions: "magazine", publications: "magazine",
  submitting: "submit", submitted: "submit", submissions: "submit", contribute: "submit", contributing: "submit", upload: "submit", uploading: "submit", send: "submit", sending: "submit", turn: "submit",
  articles: "article", stories: "story", works: "work", projects: "project", papers: "paper",
  browse: "archive", browsing: "archive", collection: "archive", catalog: "archive",
  read: "reading", viewer: "reading", flipbook: "reading", book: "reading",
  comment: "comments", commenting: "comments", feedback: "contact", message: "contact", email: "contact", reach: "contact",
  rate: "rating", rated: "rating", stars: "rating", review: "rating",
  join: "joining", membership: "joining", member: "joining", register: "joining", registration: "joining",
  meeting: "meetings", meets: "meetings", meetup: "meetings", meet: "meetings",
  developer: "developers", built: "developers", programmer: "developers", programmers: "developers", qa: "developers", tester: "developers", testing: "developers", documentation: "developers",
  editor: "editorial", editors: "editorial", board: "editorial", staff: "team", people: "team", person: "team", moderator: "team", mayor: "team",
  mission: "purpose", goal: "purpose", goals: "purpose", objective: "purpose",
  workshop: "workshops", trainings: "workshops", training: "workshops", classes: "workshops",
  login: "account", signin: "account", sign: "account", password: "account", admin: "account", dashboard: "account",
  campus: "location", address: "location", directions: "location", map: "location", find: "location",
  hours: "office", schedule: "office", open: "office", time: "office",
  pdfs: "pdf", files: "file", format: "file", size: "file",
  status: "review", decision: "review", approve: "review", rejected: "review", pending: "review",
  favorite: "save", saved: "save", bookmark: "save", like: "likes", liked: "likes", reaction: "likes",
  facebook: "social", socials: "social", social: "social",
  vibe: "vibe", club: "vibe", uic: "university", university: "university",
};

const normalize = (value) => value
  .toLocaleLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\bwhat['’]s\b/g, "what is")
  .replace(/\bwho['’]s\b/g, "who is")
  .replace(/\bwhere['’]s\b/g, "where is")
  .replace(/[^a-z0-9@.]+/g, " ")
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => aliases[word] || word.replace(/ies$/, "y").replace(/s$/, ""));

const answer = (text, path, label) => ({ text, path, label });

const topics = [
  {
    id: "purpose", phrases: ["what is vibe", "what is vibe club", "what is the vibe digital magazine", "what is this website", "what is this site", "what is this site for", "what is the website about", "what does the website do", "what does this site do", "what is the purpose of the website", "what does vibe stand for", "what does the club do"],
    keywords: ["purpose", "vibe", "university", "magazine", "content", "creation", "audience", "campus", "stories", "engagement", "digital"],
    response: answer("VIBE stands for Virtual Initiative For Building Engagement. This UIC digital magazine hub shares campus stories, student work, fresh perspectives, and creative projects. It also supports The VIBE Club’s online presence and student community.", "/about", "Learn about VIBE"),
  },
  {
    id: "navigation", phrases: ["where do i find", "where can i", "take me to", "what pages", "website sections", "site menu", "main pages"],
    keywords: ["home", "archive", "about", "submit", "contact", "navigation", "menu", "pages", "sections", "website"],
    response: answer("The main pages are Home, Archive, About, Submit, Contact, and Login. Use the navigation bar to open them. Home highlights the latest issue and club information; Archive lists published magazines.", "/", "Go to Home"),
  },
  {
    id: "home", phrases: ["home page", "homepage", "latest magazine", "latest issue", "upcoming events", "what is on the home page"],
    keywords: ["home", "latest", "issue", "events", "opportunities", "highlights", "wed", "wednesday"],
    response: answer("The Home page highlights the latest published magazine, upcoming events when available, ways to submit work, and ways to join The VIBE Club. Current issue and event details can change, so check Home or browse the Archive for what is available now. The page says the club meets every Wednesday.", "/", "Open Home"),
  },
  {
    id: "archive", phrases: ["find old issues", "past issues", "published works", "browse magazines", "where are the magazines", "magazine archive"],
    keywords: ["archive", "magazine", "published", "past", "browse", "issue", "student", "research", "project", "find"],
    response: answer("Open the Archive to browse published magazine issues. Select an issue to read it; the archive also shows its author, course, publication date, and available ratings. If no issues appear, there may not be any published magazines available yet.", "/archive", "Browse the Archive"),
  },
  {
    id: "reading", phrases: ["how do i read", "where do i read", "where to read", "open a magazine", "read an issue", "turn the pages", "zoom in", "magazine reader"],
    keywords: ["reading", "magazine", "page", "flip", "swipe", "zoom", "reader", "pdf", "read"],
    response: answer("Choose a magazine in the Archive to open its reader. The reader supports page turning; on mobile, swipe or tap the page corners, and rotate your device for a side-by-side view. Zoom controls are available for closer reading.", "/archive", "Choose a magazine"),
  },
  {
    id: "submit", phrases: ["submit my work", "send my work", "send in my work", "turn in my work", "share my work", "contribute to the magazine", "how to submit", "how do i submit", "where can i submit", "submission form"],
    keywords: ["submit", "work", "article", "story", "project", "contribute", "upload", "submission", "publish", "creative"],
    response: answer("Go to Submit and complete the form with your name, UIC email, student ID, work title, course/program, category, abstract, and PDF. Your submission is marked Pending after it is sent, and the editorial team reviews it within one week.", "/submit", "Open Submit"),
  },
  {
    id: "eligibility", phrases: ["who can submit", "student email", "email requirement", "school email", "uic email", "email address for submissions"],
    keywords: ["submit", "student", "email", "uic", "eligibility", "address", "domain", "student id"],
    response: answer("The Submit form requires an email address ending in @uic.edu.ph, along with your name and student ID. The Contact feedback form also checks for a @uic.edu.ph address.", "/submit", "Submission requirements"),
  },
  {
    id: "fileRules", phrases: ["file size limit", "what file type", "upload requirements", "accepted file", "pdf size", "submission format", "submit pdf"],
    keywords: ["pdf", "file", "format", "size", "upload", "maximum", "limit", "megabyte", "mb"],
    response: answer("Submissions must be PDF files no larger than 50 MB. The form rejects other file types and files above that size.", "/submit", "Open Submit"),
  },
  {
    id: "categories", phrases: ["submission categories", "what can i submit", "category options", "types of work"],
    keywords: ["category", "categories", "design", "literary", "visualization", "other", "work", "submit", "type"],
    response: answer("The submission categories are Design Project, Literary Work, Data Visualization, and Other.", "/submit", "See categories"),
  },
  {
    id: "review", phrases: ["submission status", "how long review", "when will i hear", "check my submission", "submission decision"],
    keywords: ["review", "week", "pending", "status", "decision", "accepted", "rejected", "submission", "notification"],
    response: answer("The page says the editorial team reviews submissions within one week. New submissions are marked Pending, and the site indicates that submission status notifications are sent by email. For a specific submission, use Contact to ask the team.", "/contact", "Contact the team"),
  },
  {
    id: "join", phrases: ["join the club", "become a member", "join vibe", "pre register", "preregister", "how to join", "what day does vibe meet", "when does the club meet", "how often does the club meet"],
    keywords: ["joining", "join", "club", "member", "pre", "register", "wednesday", "meetings", "creative", "ideas"],
    response: answer("The Home page says The VIBE Club meets every Wednesday and welcomes creative ideas, articles, and features. It also has a “Pre-register Our Club” link for people interested in joining.", "/", "See club information"),
  },
  {
    id: "mission", phrases: ["what is the mission", "vibe mission", "what does the club offer", "what do you teach"],
    keywords: ["mission", "purpose", "workshops", "seo", "photography", "videography", "writing", "prompting", "entrepreneurship", "innovation", "skills"],
    response: answer("The VIBE Club’s mission is to support growth and innovation through workshops in SEO, digital and mobile photography, videography, content creation, article writing, and AI prompting. It also promotes entrepreneurship, innovation, and social impact.", "/about", "Read About"),
  },
  {
    id: "editorial", phrases: ["editorial board", "editor in chief", "who edits", "magazine staff", "creative director", "creatives director", "production director"],
    keywords: ["editorial", "editor", "board", "franzen", "francis", "patonial", "cris", "manero", "writer", "production", "director", "about"],
    response: answer("The About page lists Franzen Kristel Perin as Editor in Chief, Francis Patonial as Creatives Director, Cris John David Manero, MIT as Digital Director, and TCI Writer as Production Director. The Contact page separately lists Cris John David Manero as Club Moderator and Franzen Kristel Perin as Club Mayor.", "/about", "View the team"),
  },
  {
    id: "team", phrases: ["who is on the team", "who are the team members", "who runs the club", "who is behind vibe", "people behind the website"],
    keywords: ["team", "staff", "people", "club", "members", "who", "runs"],
    response: answer("The website lists the editorial board, club heads, and developers on its About and Contact pages. Ask about the editorial board, developers, or club heads for the specific names and roles shown on those pages.", "/about", "View About"),
  },
  {
    id: "developers", phrases: ["who made this website", "website developers", "development team", "who built vibe", "who coded this"],
    keywords: ["developers", "developer", "built", "website", "nico", "mahipus", "joshua", "mendoza", "bobby", "malaga", "coder", "programmer", "ui", "ux"],
    response: answer("The About page lists Nico Mahipus as Lead Developer & UI/UX Designer, and Joshua Carl Mendoza and Bobby Malaga as QA Testers & Documentation. Each is listed as pursuing a BS in Information Technology.", "/about", "Meet the developers"),
  },
  {
    id: "contact", phrases: ["contact the team", "send feedback", "where can i send feedback", "contact information", "how can i contact", "where can i contact", "email the club", "send a message"],
    keywords: ["contact", "feedback", "email", "message", "inquiry", "reach", "team", "urgent", "emergency", "franzen", "cris", "manero"],
    response: answer("Visit Contact to send feedback or an inquiry. The feedback form asks for your name, @uic.edu.ph email, subject, and message. The page also lists the club contacts: Cris John David Manero at cmanero@uic.edu.ph and Franzen Kristel Perin at fperin_240000001276@uic.edu.ph.", "/contact", "Open Contact"),
  },
  {
    id: "location", phrases: ["where is vibe club", "campus address", "where are you located", "how to get there", "find the campus"],
    keywords: ["location", "university", "campus", "davao", "address", "father", "selga", "philippines", "map"],
    response: answer("The Contact page lists the VIBE Club at the University of the Immaculate Conception, Father Selga Avenue, Davao City 8000, Philippines. It includes an embedded map for the UIC Main Campus.", "/contact", "View location"),
  },
  {
    id: "office", phrases: ["office hours", "when are you open", "what time can i visit", "office location", "where to drop in"],
    keywords: ["office", "hours", "monday", "friday", "7", "5", "ictdu", "floor", "visit", "drop"],
    response: answer("The Contact page lists office hours as Monday–Friday, 7:00 AM–5:00 PM. It says visitors can drop in at the 3rd Floor, ICTDU.", "/contact", "See Contact"),
  },
  {
    id: "rating", phrases: ["rate a magazine", "give stars", "leave a rating", "magazine ratings", "how to rate"],
    keywords: ["rating", "star", "rate", "magazine", "score", "review"],
    response: answer("You can rate a magazine from its reader page using the rating prompt. The Archive shows each issue’s average rating and number of ratings when available.", "/archive", "Open the Archive"),
  },
  {
    id: "comments", phrases: ["leave a comment", "write a comment", "comment on a magazine", "view comments", "post a comment", "comment without signing in"],
    keywords: ["comments", "comment", "name", "student", "id", "email", "course", "year", "magazine"],
    response: answer("Open a magazine and expand its Comments panel to read or add comments. Posting asks for your name, student ID, @uic.edu.ph email, course, year, and comment text.", "/archive", "Choose a magazine"),
  },
  {
    id: "engagement", phrases: ["save a magazine", "like an issue", "bookmark an issue", "can i like", "save for later"],
    keywords: ["save", "likes", "magazine", "issue", "bookmark", "favorite"],
    response: answer("The magazine reader has Like and Save controls for each issue. Their state is kept for your browser’s anonymous site user ID; you do not need to sign in to use the reader.", "/archive", "Browse magazines"),
  },
  {
    id: "account", phrases: ["how do i log in", "forgot password", "admin login", "create account", "sign in", "dashboard access"],
    keywords: ["account", "login", "password", "admin", "dashboard", "sign", "access", "reset"],
    response: answer("The Login page is for authorized site accounts and the admin dashboard is protected. If you already have an account, use Login; use the password reset link if needed. Viberon can’t create accounts or provide credentials.", "/vibelogin", "Open Login"),
  },
  {
    id: "social", phrases: ["facebook page", "social media", "follow vibe", "facebook link"],
    keywords: ["social", "facebook", "follow", "connect"],
    response: answer("The site links to The VIBE Club on Facebook at facebook.com/uicvibe.", "https://www.facebook.com/uicvibe", "Visit Facebook"),
  },
  {
    id: "viberon", phrases: ["who are you", "what is viberon", "what can you do", "what can i ask you"],
    keywords: ["viberon", "chatbot", "bot", "assistant"],
    response: answer("I’m Viberon, a prepared-answer guide to this website. I can point you to information about VIBE, magazines, submissions, joining the club, the team, and how to use the site. My answers come from the website’s published information.", null, null),
  },
  {
    id: "greeting", phrases: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"],
    keywords: [],
    response: answer("Hi! I’m Viberon. Ask me about the magazine, submitting work, the club, or any page on this website.", null, null),
  },
];

const scoreTopic = (tokens, question, topic) => {
  const tokenSet = new Set(tokens);
  const keywordMatches = topic.keywords.reduce((total, keyword) => {
    const normalized = normalize(keyword);
    if (normalized.length > 1 && normalized.every((word) => tokenSet.has(word))) return total + normalized.length;
    if (normalized.length === 1 && tokenSet.has(normalized[0])) return total + 1;
    return total;
  }, 0);
  const phraseBonus = topic.phrases.reduce((best, phrase) => {
    const normalizedPhrase = normalize(phrase).join(" ");
    if (normalizedPhrase && question.includes(normalizedPhrase)) return Math.max(best, 4 + normalizedPhrase.split(" ").length);
    return best;
  }, 0);
  return keywordMatches + phraseBonus;
};

export function getViberonAnswer(input) {
  const question = normalize(input).join(" ");
  if (!question) return answer("Type a question and I’ll look for a prepared answer about the website.", null, null);

  const tokens = normalize(input).filter((word) => !stopWords.has(word));
  const ranked = topics
    .filter((topic) => topic.id !== "greeting")
    .map((topic) => ({ topic, score: scoreTopic(tokens, question, topic) }))
    .sort((left, right) => right.score - left.score);

  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you)$/.test(question)) {
    return topics.find((topic) => topic.id === "greeting").response;
  }

  const hasClearMatch = ranked[0]?.score >= 2
    || (tokens.length <= 1 && ranked[0]?.score >= 1 && ranked[0].score > (ranked[1]?.score || 0))
    || ranked[0]?.score >= 6;
  if (hasClearMatch) {
    return ranked[0].topic.response;
  }

  return answer("I don’t have a prepared answer for that yet. I can help with Home, the Archive, reading and rating magazines, submissions, joining VIBE, the team, contact details, and site accounts. Try asking another way or open Contact to reach the team.", "/contact", "Contact the team");
}

export const viberonSuggestions = [
  "What is VIBE?",
  "How do I submit my work?",
  "How can I join the club?",
  "Who built this website?",
];
