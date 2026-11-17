-- Answer It! or BOOM! — Idempotent seed: 1 initial session + 60 easy questions
-- Distribution: 42 software (~70%), 12 general (~20%), 6 fun (~10%)

insert into public.sessions (status)
select 'waiting'
where not exists (select 1 from public.sessions);

with seed_questions (question, options, correct_index, category, difficulty, is_active) as (
  values
    -- Software (42)
    ('What does HTML stand for?', '["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Mainframe"]'::jsonb, 0, 'software', 'easy', true),
    ('Which language styles the look and layout of a web page?', '["Python", "CSS", "SQL", "Bash"]'::jsonb, 1, 'software', 'easy', true),
    ('What does CSS stand for?', '["Computer Style Sheets", "Cascading Style Sheets", "Creative Syntax System", "Coded Screen Styles"]'::jsonb, 1, 'software', 'easy', true),
    ('Which Git command saves staged changes to your local repository history?', '["git push", "git clone", "git commit", "git fetch"]'::jsonb, 2, 'software', 'easy', true),
    ('Which Git command downloads a remote repository onto your computer for the first time?', '["git clone", "git merge", "git branch", "git stage"]'::jsonb, 0, 'software', 'easy', true),
    ('Which Git command uploads your local commits to a remote repository like GitHub?', '["git pull", "git push", "git init", "git status"]'::jsonb, 1, 'software', 'easy', true),
    ('Which Git command shows modified and untracked files in your working directory?', '["git log", "git status", "git checkout", "git reset"]'::jsonb, 1, 'software', 'easy', true),
    ('In programming, what is a "bug"?', '["A hardware cooling fan", "An error or unexpected behavior in code", "A fast keyboard shortcut", "A compressed ZIP file"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "API" stand for?', '["Application Programming Interface", "Automated Page Index", "Applied Protocol Internet", "Advanced Program Installer"]'::jsonb, 0, 'software', 'easy', true),
    ('What does "JSON" stand for?', '["Java Standard Output Network", "JavaScript Object Notation", "Joined System Object Name", "Just Simple Open Nodes"]'::jsonb, 1, 'software', 'easy', true),
    ('In most programming languages, what index does the first item in an array have?', '["-1", "0", "1", "2"]'::jsonb, 1, 'software', 'easy', true),
    ('What data type stores only true or false values?', '["Integer", "String", "Boolean", "Float"]'::jsonb, 2, 'software', 'easy', true),
    ('What data type is used for text like "Hello, Cadet!"?', '["String", "Boolean", "Integer", "Array"]'::jsonb, 0, 'software', 'easy', true),
    ('In JavaScript, which keyword declares a variable that cannot be reassigned?', '["var", "let", "const", "static"]'::jsonb, 2, 'software', 'easy', true),
    ('In JavaScript, what does console.log() do?', '["Saves a file to disk", "Prints output to the developer console", "Deletes browser cookies", "Restarts the server"]'::jsonb, 1, 'software', 'easy', true),
    ('Which HTTP status code means "OK" (request succeeded)?', '["200", "301", "404", "500"]'::jsonb, 0, 'software', 'easy', true),
    ('Which HTTP status code means "Not Found"?', '["200", "201", "404", "503"]'::jsonb, 2, 'software', 'easy', true),
    ('Which HTTP status code family indicates a server-side error (like 500)?', '["1xx", "2xx", "4xx", "5xx"]'::jsonb, 3, 'software', 'easy', true),
    ('What does SQL stand for?', '["Structured Query Language", "Simple Quick Logic", "System Queue Loader", "Server Quality Link"]'::jsonb, 0, 'software', 'easy', true),
    ('In SQL, which keyword retrieves rows from a database table?', '["INSERT", "SELECT", "DROP", "UPDATE"]'::jsonb, 1, 'software', 'easy', true),
    ('What is a "pull request" (PR) on GitHub?', '["A request to delete your laptop", "A proposal to review and merge code changes", "A command to download npm packages", "A database password reset"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "IDE" stand for?', '["Internet Data Engine", "Integrated Development Environment", "Internal Disk Emulator", "Indexed Document Editor"]'::jsonb, 1, 'software', 'easy', true),
    ('Which file usually lists a Node.js project''s dependencies and scripts?', '["README.md", "package.json", "index.html", ".gitignore"]'::jsonb, 1, 'software', 'easy', true),
    ('What is the purpose of a .gitignore file?', '["To encrypt secret keys", "To tell Git which files or folders not to track", "To format TypeScript code", "To deploy a website to Vercel"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "URL" stand for?', '["Uniform Resource Locator", "Universal Routing Language", "User Reference Link", "Unified Remote Login"]'::jsonb, 0, 'software', 'easy', true),
    ('What does "localhost" refer to?', '["Google''s main data center", "Your own computer running the code", "A public Wi-Fi router", "An expired domain name"]'::jsonb, 1, 'software', 'easy', true),
    ('Which HTML tag is used to create a clickable hyperlink?', '["<link>", "<a>", "<href>", "<button>"]'::jsonb, 1, 'software', 'easy', true),
    ('In CSS, which property changes the text color of an element?', '["font-color", "text-style", "color", "background"]'::jsonb, 2, 'software', 'easy', true),
    ('In CSS, what does "padding" control?', '["Space inside an element''s border around its content", "Space outside an element''s border", "The thickness of the border", "The font size of headings"]'::jsonb, 0, 'software', 'easy', true),
    ('In CSS, what does "margin" control?', '["Space inside an element''s border", "Space outside an element''s border", "Text alignment", "Border roundness"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "DOM" stand for in web browsers?', '["Data Object Module", "Document Object Model", "Direct Output Memory", "Dynamic Order Map"]'::jsonb, 1, 'software', 'easy', true),
    ('What is TypeScript?', '["A database engine", "JavaScript with static type checking", "A CSS animation library", "A Linux terminal shell"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "npm" stand for (historically / in Node.js)?', '["New Program Maker", "Node Package Manager", "Network Port Monitor", "Next Page Middleware"]'::jsonb, 1, 'software', 'easy', true),
    ('What is a "variable" in programming?', '["A named container that stores a value", "A hardware cable", "A website domain", "A permanent read-only chip"]'::jsonb, 0, 'software', 'easy', true),
    ('What does a "for loop" do?', '["Shuts down a program immediately", "Repeats a block of code multiple times", "Converts text to uppercase", "Connects to Wi-Fi"]'::jsonb, 1, 'software', 'easy', true),
    ('What is "README.md" typically used for in a code repository?', '["Storing user passwords", "Documenting what the project does and how to run it", "Compiling CSS files", "Replacing the database"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "CLI" stand for?', '["Command Line Interface", "Code Link Integration", "Cloud Logic Inspector", "Central Loop Index"]'::jsonb, 0, 'software', 'easy', true),
    ('In a terminal, which command lists files in the current directory on macOS/Linux (and PowerShell)?', '["cd", "ls", "mkdir", "rm"]'::jsonb, 1, 'software', 'easy', true),
    ('In a terminal, which command changes your current working directory?', '["ls", "pwd", "cd", "cat"]'::jsonb, 2, 'software', 'easy', true),
    ('Why should API keys and secrets NEVER be committed to a Git repo?', '["They make the font blurry", "Anyone with repo access or git history could steal them", "Git refuses to push JSON files", "They slow down CSS animations"]'::jsonb, 1, 'software', 'easy', true),
    ('What does "HTTPS" add compared to "HTTP"?', '["Larger images", "Encryption in transit using TLS", "Automatic dark mode", "Faster mouse clicks"]'::jsonb, 1, 'software', 'easy', true),
    ('In React, what is a "component"?', '["A reusable UI building block", "A SQL database table", "A Git branch name", "A browser bookmark"]'::jsonb, 0, 'software', 'easy', true),

    -- General / Tech Culture (12)
    ('Which keyboard shortcut copies selected text on Windows/Linux (and Cmd+C on Mac)?', '["Ctrl+V", "Ctrl+C", "Ctrl+X", "Ctrl+Z"]'::jsonb, 1, 'general', 'easy', true),
    ('Which keyboard shortcut usually undoes your last action (Cmd+Z on Mac)?', '["Ctrl+Z", "Ctrl+S", "Ctrl+F", "Ctrl+P"]'::jsonb, 0, 'general', 'easy', true),
    ('Which keyboard shortcut opens "Find" in most browsers and code editors?', '["Ctrl+A", "Ctrl+F", "Ctrl+R", "Ctrl+W"]'::jsonb, 1, 'general', 'easy', true),
    ('How many bits are in one byte?', '["4", "8", "16", "32"]'::jsonb, 1, 'general', 'easy', true),
    ('What two digits make up binary code?', '["0 and 1", "1 and 2", "0 and 9", "A and B"]'::jsonb, 0, 'general', 'easy', true),
    ('What does "RAM" stand for?', '["Read Access Module", "Random Access Memory", "Rapid Application Mode", "Remote Archive Machine"]'::jsonb, 1, 'general', 'easy', true),
    ('What does "CPU" stand for?', '["Central Processing Unit", "Computer Power Utility", "Core Program User", "Circuit Panel Unit"]'::jsonb, 0, 'general', 'easy', true),
    ('What does "PDF" stand for?', '["Public Data Folder", "Portable Document Format", "Printed Design File", "Personal Digital Form"]'::jsonb, 1, 'general', 'easy', true),
    ('Which browser shortcut opens Developer Tools (Inspect) on Windows/Linux Chrome?', '["F1", "F5", "F12", "Esc"]'::jsonb, 2, 'general', 'easy', true),
    ('What does "open-source software" mean?', '["Software with publicly available source code under a license", "Software that only runs without internet", "Software that has no bugs", "Software written only in Python"]'::jsonb, 0, 'general', 'easy', true),
    ('What does "2FA" stand for in account security?', '["Two-Factor Authentication", "Two-File Archive", "Total Firewall Access", "Timed Fast Authorization"]'::jsonb, 0, 'general', 'easy', true),
    ('Which key refreshes the current page in most web browsers?', '["F2", "F5", "F8", "F10"]'::jsonb, 1, 'general', 'easy', true),

    -- Fun / Icebreaker (6)
    ('What is "rubber duck debugging"?', '["Cleaning your keyboard in a bathtub", "Explaining your code line-by-line to a rubber duck to spot bugs", "Testing apps only during rain", "Replacing tests with emojis"]'::jsonb, 1, 'fun', 'easy', true),
    ('Why do many developers prefer dark mode in their code editor?', '["It multiplies CPU speed by 10x", "It reduces screen glare and looks cool", "Light mode deletes semicolons", "GitHub requires dark mode to push"]'::jsonb, 1, 'fun', 'easy', true),
    ('When a developer says "It works on my machine!", what usually happened?', '["Their laptop is broken", "The app runs locally for them but fails elsewhere", "They finished early and went home", "The database migrated itself"]'::jsonb, 1, 'fun', 'easy', true),
    ('What is the classic first message printed when learning a new programming language?', '["Goodbye, Bug!", "Hello, World!", "Start Server!", "404 Found!"]'::jsonb, 1, 'fun', 'easy', true),
    ('What happens when you answer a question right in Answer It! or BOOM!?', '["Your bomb explodes immediately", "You earn points and +30 seconds on your fuse", "Your score resets to zero", "Everyone else gets kicked"]'::jsonb, 1, 'fun', 'easy', true),
    ('Which snack is famously NOT recommended inside a mechanical keyboard?', '["Crumby crackers", "Clean air", "A dust cover", "Nothing at all"]'::jsonb, 0, 'fun', 'easy', true)
)
insert into public.questions (question, options, correct_index, category, difficulty, is_active)
select s.question, s.options, s.correct_index, s.category, s.difficulty, s.is_active
from seed_questions s
where not exists (
  select 1 from public.questions q where q.question = s.question
);
