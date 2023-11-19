const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ejs = require('ejs');
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const argon2 = require('argon2');
const crypto = require('crypto');
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const { attemptSilentLogin } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTHO_secret,
  baseURL: process.env.AUTHO_baseURL,
  clientID: process.env.AUTHO_CLIENT_ID,
  issuerBaseURL: process.env.AUTHO_BASEURI_issuer
};

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
const admindashEjsPath = path.join(__dirname, "../views/admindash.ejs");
const admincatalogueEjsPath=path.join(__dirname, "../views/admincatalog.ejs");
const dashEjsPath=path.join(__dirname, "../views/admindash.ejs");

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

// app.get("/", userhandler);
app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    const user = req.oidc.user;
    console.log(user);
    res.render(dashEjsPath, { user }); // Render the dashboard for logged-in users
  } else {
    res.redirect('/login'); // Redirect non-logged-in users to the login page
  }
});

app.get('/profile', requiresAuth(), (req, res) => {
  console.log(req.oidc);
  res.send(JSON.stringify(req.oidc.user));
});

// Protected route that requires authentication
app.get('/protected', (req, res) => {
   console.log(req.oidc);
  if (req.oidc.isAuthenticated()) {
    // User is authenticated, access protected resource
    res.send('Access to protected resource granted');
     console.log(req.oidc);
  } else {
    // User is not authenticated, redirect to login
    res.redirect('/login');
     console.log(req.oidc);
  }
});

app.get("/dashboard/admin", async (req, res) => {
  res.render(dashEjsPath, { name: 'Admin' ,account:'Admin Account',img:'https://siddht1.github.io/dashboard_p1/assets/images/faces/admin.png'});
});
app.get("/dashboard/kaushik", async (req, res) => {
  res.render(dashEjsPath, { name: 'Kaushik',account:'Kaushik Neogi Account',img:'https://siddht1.github.io/dashboard_p1/assets/images/faces/kaushik_neogi.jpeg' });
});
app.get("/dashboard/sohini", async (req, res) => {
  res.render(dashEjsPath, { name: 'Sohini',account:'Sohini Neogi Account',img:'https://siddht1.github.io/dashboard_p1/assets/images/faces/sohini_neogi.jpeg' });
});
app.get("/dashboard/catalog/*", async (req, res) => {
  res.render(catalogueEjsPath, {name:name,account:user,img:'https://siddht1.github.io/dashboard_p1/assets/images/faces-clipart/pic-1.png'});
});
app.get("/dashboard/user", async (req, res) => {
  // res.render(dashEjsPath, { name: 'User' ,account:'User',img:'https://siddht1.github.io/dashboard_p1/assets/images/faces-clipart/pic-1.png'});
    // redirect to user Dashboard 
      res.redirect('https://auth.kivtechs.cloud/register');
});

async function baseHandler(req, res) {

  const log = {
    lat: req.headers['x-vercel-ip-latitude'],
    lon: req.headers['x-vercel-ip-longitude'],
    location: req.headers['x-vercel-ip-city'] + ',' + req.headers['x-vercel-ip-country-region'] + ',' + req.headers['x-vercel-ip-country'],
    IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    UA: req.headers['user-agent'],
    uuid: uuidv4(),
   date_time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })

    // date_time: new Date().toLocaleString(undefined, { timeZone: 'user' }) // Change the date time to user's time
  };

  const { data, error } = await supabase.from('visitor').insert([log]);

  if (error) {
    console.error('Error inserting log:', error);
    res.status(500).send('Error inserting log');
  } else {
    console.log('Log inserted successfully:', data);
  }

  let ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  redirectView(req.query.view, res, req.headers, ip_address);
}

function redirectView(view, res, headers, ip_address) {
  let latitude = headers['x-vercel-ip-latitude'];
  let longitude = headers['x-vercel-ip-longitude'];
  let location = headers['x-vercel-ip-city'] + ',' + headers['x-vercel-ip-country-region'] + ',' + headers['x-vercel-ip-country'];

  switch (view) {
    case 'chatbot':
      res.redirect("https://siddh-kivtechs.github.io/menu_4/");
      break;
    case 'ovh':
      res.redirect("https://ovh.kivtechs.cloud/");
      break;
    case 'adobe':
      res.redirect("https://siddh-kivtechs.github.io/kivtechs/");
      break;
    case 'tts':
      res.redirect("https://jstts1.kivtechs.cloud/");
      break;
    case 'image_api':
      res.redirect("https://image.kivtechs.cloud/");
      break;
    case 'login':
      res.redirect('https://siddh-kivtechs.github.io/login_sample/');
      break;
    default:
      res.render('client', { latitude, longitude, location, ip_address });
  }
}

app.get('/chao', (req, res) => {
  res.redirect("https://siddh-kivtechs.github.io/menu_4/");
});
app.post("/", async (req, res) => {
  try {
    console.log("POST request received");

    const { email, password } = req.body;

    const loginData = {
      email,
      password
    };

    const passwordHash = await argon2.hash(loginData.password);
    console.log('Password hash:', passwordHash);

    loginData.password = passwordHash;
    console.log('Updated login data:', loginData);

    const { data, error } = await supabase.from('login').insert([loginData]);

    if (error) {
      console.error('Error inserting login data:', error);
      res.status(500).json({ error: 'Error inserting login data' });
    } else {
      console.log('Login data inserted successfully:', data);
      res.json({ success: true }); // Send a success response as JSON
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send an error response as JSON
  }
});

app.get("/logs", async (req, res) => {
  const { data, error } = await supabase.from('visitor').select();

  if (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ error: 'Error getting log data' });
  } else {
    console.log('Logs retrieved successfully:', data);
    res.json(data); // Send the logs data as JSON
  }
});

app.all("/login", (req, res) => {  
    // res.redirect("https://kivtechs.cloud/login");
  res.redirect('https://auth.kivtechs.cloud/login');

});
app.all("/logout", (req, res) => {  
    // res.redirect("https://kivtechs.cloud/logout");
   res.redirect('https://auth.kivtechs.cloud/logout');


});

app.all('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});
