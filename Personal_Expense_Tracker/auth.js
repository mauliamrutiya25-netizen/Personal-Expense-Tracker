
const USERS_KEY = 'expense_tracker_users';
const CURRENT_USER_KEY = 'expense_tracker_current_user';

// Model: User { username, email, password(plain for demo), joinedDate }

class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];  // // this. refers to the current object  here current obj is auth, auth is saying use me which auth the auth is const auth = new Auth();=> this one here when user first  comes then it returns []  
        this.currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));// and here when first user comes it returns null after saving it returns all the things saving means setItem
    }
// When you save data (like users) into localStorage or send it over the network, it’s stored as a string. 
// To work with it in your code, you need to turn that string back into an object or array. That’s exactly what JSON.parse does.

    signup(username, email, password) {
        if (this.users.find(user => user.username === username)) {
            return { success: false, message: 'Username already taken' };
        }
        if (this.users.find(user => user.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password, // In a real app, this should be hashed!
            joinedDate: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        // Auto-login after signup
        this.login(username, password);
        return { success: true };
    }

    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));  //CURRENT_USER_KEY is 
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = 'index.html';
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    checkAuth() {
        // Protected pages
        const protectedPages = ['dashboard.html', 'add.html', 'transactions.html'];
        const currentPage = window.location.pathname.split('/').pop();

        if (protectedPages.includes(currentPage) && !this.isAuthenticated()) {
            window.location.href = 'login.html';
        }

        // Redirect logged-in users away from auth pages
        if ((currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'index.html') && this.isAuthenticated()) {
            // Optional: Redirect index to dashboard if logged in, but let's keep index as landing
            if (currentPage !== 'index.html') window.location.href = 'dashboard.html';
        }
    }

    getCurrentUser() {
        return this.currentUser;    //this.currentUser=user
    }

    saveUsers() {
        localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }

    init() {
        this.checkAuth();
        this.updateNav();
    }

    updateNav() {
        // Typically called after DOM Load
        const userDisplay = document.getElementById('user-display');
        if (userDisplay && this.currentUser) {
            userDisplay.textContent = `Hi, ${this.currentUser.username}`;
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
}

const auth = new Auth();
auth.init();
