// Mobile menu toggle
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Mask a password with asterisks
function maskPassword(pass) {
    return "*".repeat(pass.length);
}

// Copy text to clipboard
function copyText(txt) {
    navigator.clipboard.writeText(txt).catch(() => {
        console.error("Clipboard copying failed");
    });
}

// Delete a password entry by website
const deletePassword = (website) => {
    let data = localStorage.getItem("passwords");
    let arr = JSON.parse(data) || [];
    let arrUpdated = arr.filter((e) => e.website !== website);
    localStorage.setItem("passwords", JSON.stringify(arrUpdated));
    showPasswords(); // refresh table after deletion
};

// Show all saved passwords in the table
const showPasswords = () => {
    let tb = document.querySelector("table");
    let data = localStorage.getItem("passwords");

    if (data == null || JSON.parse(data).length === 0) {
        tb.innerHTML = "No Data To Show";
    } else {
        tb.innerHTML = `
            <tr>
                <th>Website</th>
                <th>Email/Username</th>
                <th>Password</th>
                <th>Delete</th>
            </tr>
        `;

        let arr = JSON.parse(data);
        let str = "";

        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];

            str += `
                <tr>
                    <td>
                        ${element.website}
                        <div class="copy-container">
                            <img onclick="copyText('${element.website}')" src="./img/copy.png" class="copy-icon" alt="Copy">
                            <span class="tooltip">Copy</span>
                        </div>
                    </td>
                    <td>
                        ${element.username}
                        <div class="copy-container">
                            <img onclick="copyText('${element.username}')" src="./img/copy.png" class="copy-icon" alt="Copy">
                            <span class="tooltip">Copy</span>
                        </div>
                    </td>
                    <td>
                        <span id="pw-${index}">${maskPassword(element.password)}</span>
                        <div class="copy-container">
                            <img onclick="copyText('${element.password}')" src="./img/copy.png" class="copy-icon" alt="Copy">
                            <span class="tooltip">Copy</span>
                        </div>
                        <img src="./img/show.png" id="toggle-${index}" class="toggle-password" data-password="${element.password}" alt="Show/Hide">
                    </td>
                    <td>
                        <button class="btnsm" onclick="deletePassword('${element.website}')">Delete</button>
                    </td>
                </tr>
            `;
        }

        tb.innerHTML += str;

        // Toggle password visibility in table
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            const toggleBtn = document.getElementById(`toggle-${index}`);
            const pwSpan = document.getElementById(`pw-${index}`);

            toggleBtn.addEventListener("click", () => {
                if (pwSpan.textContent === maskPassword(element.password)) {
                    pwSpan.textContent = element.password;
                    toggleBtn.src = "./img/hide.png";
                } else {
                    pwSpan.textContent = maskPassword(element.password);
                    toggleBtn.src = "./img/show.png";
                }
            });
        }
    }

    // Clear input fields
    website.value = "";
    username.value = "";
    password.value = "";
};

// Toggle password visibility in input field
const inputToggle = document.getElementById("input-toggle");
const passwordInput = document.getElementById("password");

inputToggle.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        inputToggle.src = "./img/hide.png";
    } else {
        passwordInput.type = "password";
        inputToggle.src = "./img/show.png";
    }
});

console.log("Working");
showPasswords();

// Save new password entry
document.querySelector(".btn").addEventListener("click", (e) => {
    e.preventDefault();

    const messageBox = document.getElementById("form-message");
    messageBox.style.display = "none"; // reset

    // Validation: check empty fields
    if (website.value.trim() === "" || username.value.trim() === "" || password.value.trim() === "") {
        messageBox.textContent = "⚠️ Please fill in all fields before saving.";
        messageBox.className = "form-message error";
        messageBox.style.display = "block";
        return; // stop here
    }

    let passwords = localStorage.getItem("passwords");
    const newEntry = {
        website: website.value,
        username: username.value,
        password: password.value
    };

    if (passwords == null) {
        let json = [newEntry];
        localStorage.setItem("passwords", JSON.stringify(json));
    } else {
        let json = JSON.parse(passwords);
        json.push(newEntry);
        localStorage.setItem("passwords", JSON.stringify(json));
    }

    // Success message
    messageBox.textContent = "✅ Password saved successfully!";
    messageBox.className = "form-message success";
    messageBox.style.display = "block";

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);

    showPasswords(); // refresh table after saving
});