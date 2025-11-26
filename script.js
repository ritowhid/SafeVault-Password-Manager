// =================================================================
// GLOBAL STATE & UTILITIES
// =================================================================

const LS_PASSWORDS_KEY = 'safeVault_passwords';
const LS_NOTES_KEY = 'safeVault_notes';
const LS_THEME_KEY = 'safeVault_theme';
let passwords = [];
let notes = [];

// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const navMenu = document.getElementById('nav-menu');
const menuToggle = document.getElementById('menu-toggle');
const appContainer = document.getElementById('app-container');

// --- Page Navigation Elements ---
const pageLinks = document.querySelectorAll('[data-page-target]');
const navItems = document.querySelectorAll('.nav-item');

// --- Add Password Elements ---
const passwordForm = document.getElementById('password-form');
const websiteInput = document.getElementById('website');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const editIndexInput = document.getElementById('edit-index');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const inputToggle = document.getElementById('input-toggle');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');
const formMessage = document.getElementById('form-message');

// --- Saved Passwords List Elements (on dedicated page and add page) ---
const passwordsTableAdd = document.getElementById('passwords-table-add');
const passwordsTableMain = document.getElementById('passwords-table-main');
const passwordCountList = document.getElementById('password-count-list');
const passwordCountMain = document.getElementById('password-count-main');
const searchInputAdd = document.getElementById('search-input-add');
const searchInputMain = document.getElementById('search-input-main');

// --- Password Generator Elements ---
const generateBtnMain = document.getElementById('generate-password-main-btn');
const generatedPasswordInput = document.getElementById('generated-password');
const copyGeneratedBtn = document.getElementById('copy-generated-btn');
const genLengthRange = document.getElementById('gen-length-range');
const lengthValueSpan = document.getElementById('length-value');
const genUppercase = document.getElementById('gen-uppercase');
const genLowercase = document.getElementById('gen-lowercase');
const genNumbers = document.getElementById('gen-numbers');
const genSymbols = document.getElementById('gen-symbols');

// --- Notes Elements ---
const noteForm = document.getElementById('note-form');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const noteEditIndexInput = document.getElementById('note-edit-index');
const noteSubmitBtn = document.getElementById('note-submit-btn');
const noteCancelBtn = document.getElementById('note-cancel-btn');
const notesList = document.getElementById('notes-list');
const noteCountSpan = document.getElementById('note-count');

// --- Import/Export Elements ---
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');


// =================================================================
// LOCALSTORAGE DATA HANDLING
// =================================================================

function loadData() {
    try {
        const storedPasswords = localStorage.getItem(LS_PASSWORDS_KEY);
        const storedNotes = localStorage.getItem(LS_NOTES_KEY);

        if (storedPasswords) {
            passwords = JSON.parse(storedPasswords);
        } else {
            passwords = [];
        }

        if (storedNotes) {
            notes = JSON.parse(storedNotes);
        } else {
            notes = [];
        }
    } catch (e) {
        console.error("Error loading data from localStorage:", e);
        // Fallback to empty arrays on failure
        passwords = [];
        notes = [];
    }
}

function savePasswords() {
    localStorage.setItem(LS_PASSWORDS_KEY, JSON.stringify(passwords));
    renderPasswords(passwordsTableAdd, searchInputAdd.value);
    renderPasswords(passwordsTableMain, searchInputMain.value);
}

function saveNotes() {
    localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
    renderNotes();
}

// =================================================================
// THEME & NAVIGATION
// =================================================================

function initTheme() {
    const savedTheme = localStorage.getItem(LS_THEME_KEY);
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.setAttribute('data-theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
    }
    updateThemeIcon(body.getAttribute('data-theme'));
}

function updateThemeIcon(theme) {
    themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const currentTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', currentTheme);
    localStorage.setItem(LS_THEME_KEY, currentTheme);
    updateThemeIcon(currentTheme);
}

function navigateTo(targetPageId) {
    const pages = document.querySelectorAll('.page');
    const targetPage = document.getElementById(targetPageId);

    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
        // Clear inputs on page exit (except main menu)
        if (page.id !== 'main-menu') {
             // Reset forms/fields
             const form = page.querySelector('form');
             if (form) form.reset();
        }
    });

    // Show target page
    if (targetPage) {
        targetPage.classList.add('active');
        // Specific refresh logic for each page type
        if (targetPageId === 'add-password-page') {
            resetPasswordForm();
            renderPasswords(passwordsTableAdd, searchInputAdd.value);
        } else if (targetPageId === 'saved-passwords-page') {
            renderPasswords(passwordsTableMain, searchInputMain.value);
        } else if (targetPageId === 'notes-page') {
            resetNoteForm();
            renderNotes();
        } else if (targetPageId === 'generate-password-page') {
             // Ensure the generated password input is clear on arrival
            generatedPasswordInput.value = '';
        }
    }
    // Close mobile nav menu
    navMenu.classList.remove('active');
    menuToggle.classList.remove('active');
}

// Initial navigation setup (start on main menu)
function initNavigation() {
    // Attach event listeners for menu buttons and back buttons
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute('data-page-target'));
        });
    });

    // Attach event listeners for main nav links
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const pageId = item.getAttribute('data-page-link');
            if (pageId) {
                e.preventDefault();
                navigateTo(pageId);
            }
        });
    });
    
    // Hamburger menu toggle
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Ensure main-menu is visible on load
    navigateTo('main-menu');
}

// =================================================================
// PASSWORD MANAGER FUNCTIONALITY
// =================================================================

function getPasswordStrength(password) {
    let score = 0;
    if (!password) return { score: 0, text: 'Empty', color: 'gray' };

    // Increase score based on length (logarithmic)
    score += Math.min(10, password.length / 3) * 10;
    
    // Character set diversity
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const charSets = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
    score += charSets * 15; // 15 points per set

    // Deduction for common patterns or repetition can be added here

    // Final assessment
    if (score < 40) {
        return { score, text: 'Weak', color: 'var(--weak-color)', class: 'strength-weak' };
    } else if (score < 75) {
        return { score, text: 'Medium', color: 'var(--medium-color)', class: 'strength-medium' };
    } else {
        return { score, text: 'Strong', color: 'var(--strong-color)', class: 'strength-strong' };
    }
}

function updatePasswordStrength() {
    const strength = getPasswordStrength(passwordInput.value);
    strengthFill.style.width = `${Math.min(100, strength.score)}%`;
    strengthFill.style.backgroundColor = strength.color;
    strengthText.textContent = `Strength: ${strength.text}`;
    strengthText.style.color = strength.color;
}

function resetPasswordForm() {
    passwordForm.reset();
    editIndexInput.value = '';
    formTitle.textContent = 'Enter Account Details';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Password';
    cancelBtn.style.display = 'none';
    formMessage.style.display = 'none';
    updatePasswordStrength();
}

function displayFormMessage(message, type = 'info') {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 3000);
}

function handlePasswordSubmit(e) {
    e.preventDefault();

    const website = websiteInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value; // Keep original password, don't trim
    
    if (!website || !username || !password) {
        displayFormMessage('All fields are required.', 'error');
        return;
    }

    const strength = getPasswordStrength(password).text;
    
    const newEntry = { website, username, password, strength, date: new Date().toISOString() };
    const editIndex = editIndexInput.value;

    if (editIndex !== '') {
        // Edit existing password
        passwords[parseInt(editIndex)] = newEntry;
        displayFormMessage('Password updated successfully!', 'success');
    } else {
        // Add new password
        passwords.unshift(newEntry);
        displayFormMessage('Password saved successfully!', 'success');
    }

    savePasswords();
    resetPasswordForm();
}

function startEditPassword(index) {
    const entry = passwords[index];
    if (!entry) return;

    // Switch to Add Password Page if not already there
    navigateTo('add-password-page');

    // Populate form
    websiteInput.value = entry.website;
    usernameInput.value = entry.username;
    passwordInput.value = entry.password;
    editIndexInput.value = index;

    // Update form buttons/title
    formTitle.textContent = 'Edit Account Details';
    submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Password';
    cancelBtn.style.display = 'block';
    updatePasswordStrength();
}

function deletePassword(index) {
    if (confirm(`Are you sure you want to delete the password for ${passwords[index].website}?`)) {
        passwords.splice(index, 1);
        savePasswords();
        displayFormMessage('Password deleted.', 'info');
    }
}

function renderPasswords(tableElement, filter) {
    const tbody = tableElement.querySelector('tbody') || tableElement.createTBody();
    let filteredPasswords = passwords;
    
    // Apply filter
    const lowerFilter = filter.toLowerCase();
    if (lowerFilter) {
        filteredPasswords = passwords.filter(p => 
            p.website.toLowerCase().includes(lowerFilter) || 
            p.username.toLowerCase().includes(lowerFilter)
        );
    }
    
    tbody.innerHTML = ''; // Clear table body

    // Update counts
    document.getElementById('password-count-list').textContent = filteredPasswords.length;
    document.getElementById('password-count-main').textContent = filteredPasswords.length;

    if (filteredPasswords.length === 0) {
        const noData = document.createElement('tr');
        noData.innerHTML = `<td colspan="5" class="no-data">No passwords found.</td>`;
        tbody.appendChild(noData);
        return;
    }
    
    // Create Table Header if it doesn't exist
    if (!tableElement.querySelector('thead')) {
        const thead = tableElement.createTHead();
        thead.innerHTML = `
            <tr>
                <th>Website</th>
                <th>Username/Email</th>
                <th>Password</th>
                <th>Strength</th>
                <th>Actions</th>
            </tr>
        `;
    }

    // Render rows
    filteredPasswords.forEach((entry, index) => {
        // Find the original index for CRUD operations
        const originalIndex = passwords.findIndex(p => p.website === entry.website && p.username === entry.username && p.date === entry.date);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td><div class="truncate">${entry.website}</div></td>
            <td><div class="truncate">${entry.username}</div></td>
            <td>
                <div class="copy-container">
                    <span class="password-text" data-password="${entry.password}">***********</span>
                    <button class="toggle-password-btn" data-visible="false" data-index="${originalIndex}" title="Toggle Visibility">
                        <i class="far fa-eye"></i>
                    </button>
                    <button class="copy-icon-btn" data-password="${entry.password}" title="Copy Password">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </td>
            <td><span class="strength-badge ${getPasswordStrength(entry.password).class}">${entry.strength}</span></td>
            <td class="action-cell">
                <button class="btnsm edit-btn" onclick="startEditPassword(${originalIndex})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btnsm delete-btn" onclick="deletePassword(${originalIndex})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        `;
    });
    
    // Attach event listeners for the dynamically created elements
    attachPasswordTableListeners(tableElement);
}

function attachPasswordTableListeners(tableElement) {
    // 1. Password Toggle Listeners
    tableElement.querySelectorAll('.toggle-password-btn').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.getAttribute('data-index'));
            const passwordSpan = btn.closest('.copy-container').querySelector('.password-text');
            const isVisible = btn.getAttribute('data-visible') === 'true';
            
            if (isVisible) {
                passwordSpan.textContent = '***********';
                btn.innerHTML = '<i class="far fa-eye"></i>';
                btn.setAttribute('data-visible', 'false');
            } else {
                passwordSpan.textContent = passwords[index].password;
                btn.innerHTML = '<i class="far fa-eye-slash"></i>';
                btn.setAttribute('data-visible', 'true');
            }
        };
    });

    // 2. Copy Button Listeners
    tableElement.querySelectorAll('.copy-icon-btn').forEach(btn => {
        btn.onclick = async () => {
            const password = btn.getAttribute('data-password');
            await copyToClipboard(password);
            
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = originalIcon;
            }, 1000);
        };
    });
}

// =================================================================
// PASSWORD GENERATOR
// =================================================================

function updateLengthDisplay() {
    lengthValueSpan.textContent = genLengthRange.value;
}

function generatePassword() {
    const length = parseInt(genLengthRange.value);
    const useUpper = genUppercase.checked;
    const useLower = genLowercase.checked;
    const useNumbers = genNumbers.checked;
    const useSymbols = genSymbols.checked;

    let charset = "";
    if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useNumbers) charset += "0123456789";
    if (useSymbols) charset += "!@#$%^&*()_+-=[]{}|;':,.<>/?";

    if (charset.length === 0) {
        generatedPasswordInput.value = "Select at least one character type.";
        return;
    }

    let password = "";
    // Ensure at least one character from each selected set is included (optional, but good practice)
    let guaranteedChars = [];
    if (useLower) guaranteedChars.push("abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]);
    if (useUpper) guaranteedChars.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]);
    if (useNumbers) guaranteedChars.push("0123456789"[Math.floor(Math.random() * 10)]);
    if (useSymbols) guaranteedChars.push("!@#$%^&*()_+-=[]{}|;':,.<>/?".replace(/ /g, "")[Math.floor(Math.random() * "!@#$%^&*()_+-=[]{}|;':,.<>/?".replace(/ /g, "").length)]);
    
    // Fill the rest of the length with random characters from the combined set
    for (let i = guaranteedChars.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mix in the guaranteed characters randomly
    password = (password + guaranteedChars.join('')).split('').sort(() => 0.5 - Math.random()).join('').substring(0, length);

    generatedPasswordInput.value = password;
}

// =================================================================
// SECURE NOTES FUNCTIONALITY
// =================================================================

function resetNoteForm() {
    noteForm.reset();
    noteEditIndexInput.value = '';
    noteSubmitBtn.innerHTML = '<i class="fas fa-plus"></i> Save Note';
    noteCancelBtn.style.display = 'none';
    document.getElementById('note-message').style.display = 'none';
}

function handleNoteSubmit(e) {
    e.preventDefault();

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    
    if (!title || !content) {
        displayNoteMessage('Note title and content cannot be empty.', 'error');
        return;
    }

    const newNote = { title, content, date: new Date().toISOString() };
    const editIndex = noteEditIndexInput.value;

    if (editIndex !== '') {
        // Edit existing note
        notes[parseInt(editIndex)] = newNote;
        displayNoteMessage('Note updated successfully!', 'success');
    } else {
        // Add new note
        notes.unshift(newNote);
        displayNoteMessage('Note saved successfully!', 'success');
    }

    saveNotes();
    resetNoteForm();
}

function displayNoteMessage(message, type = 'info') {
    const noteMessage = document.getElementById('note-message');
    noteMessage.textContent = message;
    noteMessage.className = `form-message ${type}`;
    noteMessage.style.display = 'block';
    setTimeout(() => {
        noteMessage.style.display = 'none';
    }, 3000);
}

function renderNotes() {
    notesList.innerHTML = '';
    noteCountSpan.textContent = notes.length;

    if (notes.length === 0) {
        notesList.innerHTML = '<p class="no-data" style="padding: 10px 0;">No secure notes saved yet.</p>';
        return;
    }

    notes.forEach((note, index) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <h4><i class="fas fa-file-alt"></i> ${note.title}</h4>
            <p>${note.content}</p>
            <small>Saved: ${new Date(note.date).toLocaleDateString()}</small>
            <div class="note-actions">
                <button class="btnsm edit-btn" onclick="startEditNote(${index})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btnsm delete-btn" onclick="deleteNote(${index})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
        notesList.appendChild(card);
    });
}

function startEditNote(index) {
    const note = notes[index];
    if (!note) return;

    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    noteEditIndexInput.value = index;

    noteSubmitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Note';
    noteCancelBtn.style.display = 'block';
}

function deleteNote(index) {
    if (confirm(`Are you sure you want to delete the note: "${notes[index].title}"?`)) {
        notes.splice(index, 1);
        saveNotes();
        displayNoteMessage('Note deleted.', 'info');
    }
}

// =================================================================
// IMPORT/EXPORT (BONUS FEATURE)
// =================================================================

function exportData() {
    const data = {
        passwords: passwords,
        notes: notes,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileName = 'SafeVault_data_export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    alert('Data exported successfully!');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);

            if (importedData.passwords && Array.isArray(importedData.passwords)) {
                // Warning: This overwrites all existing data
                if (confirm("WARNING: Importing data will OVERWRITE your current saved passwords and notes. Proceed?")) {
                    passwords = importedData.passwords;
                    notes = importedData.notes || []; // Import notes if present, otherwise set empty array

                    savePasswords();
                    saveNotes();
                    alert('Data imported successfully! Your passwords and notes have been updated.');
                    navigateTo('main-menu'); // Go back to main menu after import
                }
            } else {
                alert('Error: The imported file does not contain valid SafeVault password data.');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Error: Could not process the file. Please ensure it is a valid JSON export.');
        } finally {
            e.target.value = ''; // Clear file input
        }
    };
    reader.readAsText(file);
}

// =================================================================
// EVENT LISTENERS & INITIALIZATION
// =================================================================

function copyToClipboard(text) {
    // navigator.clipboard is the modern, preferred method
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text).catch(err => {
            console.error('Could not copy text: ', err);
            // Fallback for older browsers
            fallbackCopy(text);
        });
    } else {
        // Fallback for older browsers
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textarea);
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Setup
    loadData();
    initTheme();
    initNavigation();

    // 2. Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // 3. Password Form Listeners
    passwordForm.addEventListener('submit', handlePasswordSubmit);
    passwordInput.addEventListener('input', updatePasswordStrength);
    cancelBtn.addEventListener('click', resetPasswordForm);

    // Toggle password input visibility
    inputToggle.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        inputToggle.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
    });

    // 4. Password Generator Listeners
    genLengthRange.addEventListener('input', updateLengthDisplay);
    generateBtnMain.addEventListener('click', generatePassword);
    
    // Automatically regenerate on option change
    [genUppercase, genLowercase, genNumbers, genSymbols, genLengthRange].forEach(el => {
        el.addEventListener('change', generatePassword);
        el.addEventListener('input', generatePassword);
    });

    copyGeneratedBtn.addEventListener('click', async () => {
        const text = generatedPasswordInput.value;
        if (text && text !== "Select at least one character type.") {
            await copyToClipboard(text);
            const originalText = copyGeneratedBtn.innerHTML;
            copyGeneratedBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => {
                copyGeneratedBtn.innerHTML = originalText;
            }, 1000);
        }
    });

    // 5. Notes Listeners
    noteForm.addEventListener('submit', handleNoteSubmit);
    noteCancelBtn.addEventListener('click', resetNoteForm);

    // 6. Search Listeners
    searchInputAdd.addEventListener('input', () => renderPasswords(passwordsTableAdd, searchInputAdd.value));
    searchInputMain.addEventListener('input', () => renderPasswords(passwordsTableMain, searchInputMain.value));

    // 7. Import/Export Listeners
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);

    // Initial render of saved data
    renderPasswords(passwordsTableAdd, '');
    renderPasswords(passwordsTableMain, '');
    renderNotes();
});