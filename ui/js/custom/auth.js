// Authentication utilities
const Auth = {
  async checkAuth() {
    try {
      const res = await fetch('/current_user');
      const data = await res.json();
      return data.user && data.role === 'admin';
    } catch (e) {
      return false;
    }
  },

  async requireAuth() {
    const isAuthenticated = await this.checkAuth();
    if (!isAuthenticated) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  async login(username, password) {
    const res = await fetch('/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
      body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  },

  async logout() {
    await fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    });
  },

  async register(username, password) {
    const res = await fetch('/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
      body: JSON.stringify({username, password, role: 'admin'})
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return data;
  }
};

// Login page functionality
$(function(){
  // Only run login page code if we're on the login page
  if ($('#loginBtn').length === 0) return;

  function showMessage(msg, isError=true){
    $('#message').text(msg || '').toggleClass('text-danger', isError).toggleClass('text-success', !isError);
  }

  async function register(){
    const username = $('#username').val().trim();
    const password = $('#password').val();
    
    if (!username || !password) {
      showMessage('Please enter both username and password', true);
      return;
    }

    showMessage('');
    try{
      await Auth.register(username, password);
      showMessage('Registration successful! You can now log in.', false);
      $('#password').val('');
    }catch(err){
      showMessage(err.message || 'Registration failed');
    }
  }

  async function login(){
    const username = $('#username').val().trim();
    const password = $('#password').val();
    
    if (!username || !password) {
      showMessage('Please enter both username and password', true);
      return;
    }

    showMessage('');
    try{
      const data = await Auth.login(username, password);
      showMessage('Login successful! Redirecting...', false);
      // Redirect to dashboard after successful login
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }catch(err){
      showMessage(err.message || 'Invalid credentials');
    }
  }

  async function refreshUser(){
    try{
      const res = await fetch('/current_user', {credentials: 'include'});
      const data = await res.json();
      if(data.user){
        $('#curUser').text('Logged in as: ' + data.user + (data.role ? ' (' + data.role + ')' : ''));
        $('#logoutBtn').show();
      } else {
        $('#curUser').text('');
        $('#logoutBtn').hide();
      }
    }catch(e){
      console.error(e);
    }
  }

  async function logout(){
    await Auth.logout();
    await refreshUser();
    showMessage('Logged out', false);
    $('#username').val('');
    $('#password').val('');
  }

  // Handle Enter key press
  $('#username, #password').on('keypress', function(e) {
    if (e.which === 13) {
      login();
    }
  });

  $('#loginBtn').on('click', login);
  $('#regBtn').on('click', register);
  $('#logoutBtn').on('click', logout);

  // initial
  refreshUser();
});
